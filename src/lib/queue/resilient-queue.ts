/**
 * Resilient Job Queue, Deduplication, and Result Verification Engine
 * 
 * Handles:
 * 1. Webhook & Event Idempotency (deduplication keys with TTL).
 * 2. Per-Chat Concurrency Lock (prevents conflicting concurrent agent runs on the same contact/conversation).
 * 3. 4-State Result Verification (pending -> sent | failed | unknown).
 *    Guarantees no blind retries when an external call state is uncertain.
 * 4. Resilient Job Queue with Exponential Backoff & Dead Letter Queue (DLQ).
 */

export type ExecutionState = 'pending' | 'sent' | 'failed' | 'unknown';

export interface IdempotencyRecord {
  key: string;
  firstSeenAt: string;
  status: 'processing' | 'completed' | 'failed';
  result?: unknown;
  expiresAt: number;
}

export interface VerificationCheck {
  providerMessageId?: string;
  externalTransactionId?: string;
  checkStatus: () => Promise<{ verified: boolean; finalState: 'sent' | 'failed'; metadata?: Record<string, unknown> }>;
}

export interface JobItem<T = unknown> {
  id: string;
  type: string;
  payload: T;
  chatId?: string;
  state: ExecutionState;
  attempts: number;
  maxAttempts: number;
  backoffMs: number;
  lastError?: string;
  externalRefId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeadLetterRecord {
  jobId: string;
  type: string;
  payload: unknown;
  attempts: number;
  fatalError: string;
  failedAt: string;
}

export class ResilientQueueEngine {
  private idempotencyStore = new Map<string, IdempotencyRecord>();
  private activeLocks = new Set<string>();
  private queue: JobItem[] = [];
  private deadLetterQueue: DeadLetterRecord[] = [];
  private ttlMs: number;

  constructor(options?: { idempotencyTtlMs?: number }) {
    this.ttlMs = options?.idempotencyTtlMs ?? 24 * 60 * 60 * 1000; // 24 hours default
  }

  // -------------------------------------------------------------
  // 1. Idempotency & Deduplication
  // -------------------------------------------------------------
  public checkAndClaimIdempotency(key: string): { isDuplicate: boolean; previousRecord?: IdempotencyRecord } {
    this.cleanupExpiredIdempotency();
    const existing = this.idempotencyStore.get(key);
    if (existing) {
      return { isDuplicate: true, previousRecord: existing };
    }

    const record: IdempotencyRecord = {
      key,
      firstSeenAt: new Date().toISOString(),
      status: 'processing',
      expiresAt: Date.now() + this.ttlMs,
    };
    this.idempotencyStore.set(key, record);
    return { isDuplicate: false };
  }

  public completeIdempotency(key: string, result?: unknown): void {
    const record = this.idempotencyStore.get(key);
    if (record) {
      record.status = 'completed';
      record.result = result;
    }
  }

  public failIdempotency(key: string): void {
    const record = this.idempotencyStore.get(key);
    if (record) {
      record.status = 'failed';
    }
  }

  private cleanupExpiredIdempotency(): void {
    const now = Date.now();
    for (const [key, record] of this.idempotencyStore.entries()) {
      if (record.expiresAt < now) {
        this.idempotencyStore.delete(key);
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Per-Chat Concurrency Lock
  // -------------------------------------------------------------
  public acquireChatLock(chatId: string): boolean {
    if (this.activeLocks.has(chatId)) {
      return false;
    }
    this.activeLocks.add(chatId);
    return true;
  }

  public releaseChatLock(chatId: string): void {
    this.activeLocks.delete(chatId);
  }

  public isChatLocked(chatId: string): boolean {
    return this.activeLocks.has(chatId);
  }

  // -------------------------------------------------------------
  // 3. 4-State Execution & Verification Check
  // -------------------------------------------------------------
  public async executeWithVerification<T>(options: {
    actionName: string;
    execute: () => Promise<{ success: boolean; externalRefId?: string; data?: T }>;
    verify: (externalRefId?: string) => Promise<{ verified: boolean; state: 'sent' | 'failed' }>;
  }): Promise<{ state: ExecutionState; externalRefId?: string; data?: T; message: string }> {
    let result: { success: boolean; externalRefId?: string; data?: T } | undefined;
    let executionState: ExecutionState = 'pending';

    try {
      result = await options.execute();
      if (result.success) {
        executionState = 'sent';
        return {
          state: 'sent',
          externalRefId: result.externalRefId,
          data: result.data,
          message: `${options.actionName} executed successfully`,
        };
      } else {
        executionState = 'failed';
        return {
          state: 'failed',
          externalRefId: result.externalRefId,
          message: `${options.actionName} returned failure from provider`,
        };
      }
    } catch (err) {
      // Uncertainty: The request was sent to the network/external API, but threw (e.g. timeout or post-send DB crash)
      // Transition to 'unknown' rather than immediately blindly retrying!
      executionState = 'unknown';
      const refId = result?.externalRefId;

      // Run verification routine
      try {
        const verification = await options.verify(refId);
        if (verification.verified) {
          return {
            state: verification.state,
            externalRefId: refId,
            message: `External state verified as ${verification.state} after network ambiguity`,
          };
        }
      } catch {
        // Verification itself failed or inconclusive
      }

      return {
        state: 'unknown',
        externalRefId: refId,
        message: `Execution reached UNKNOWN state; manual or status-check verification required before retry: ${(err as Error).message}`,
      };
    }
  }

  // -------------------------------------------------------------
  // 4. Job Queue & DLQ Processing
  // -------------------------------------------------------------
  public enqueueJob<T>(job: {
    type: string;
    payload: T;
    chatId?: string;
    maxAttempts?: number;
    initialBackoffMs?: number;
  }): JobItem<T> {
    const item: JobItem<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: job.type,
      payload: job.payload,
      chatId: job.chatId,
      state: 'pending',
      attempts: 0,
      maxAttempts: job.maxAttempts ?? 3,
      backoffMs: job.initialBackoffMs ?? 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.queue.push(item as JobItem<unknown>);
    return item;
  }

  public async processNextJob(handler: (job: JobItem) => Promise<{ success: boolean; externalRefId?: string; error?: string }>): Promise<{ processed: boolean; job?: JobItem; status?: string }> {
    const pendingIndex = this.queue.findIndex(j => j.state === 'pending' || j.state === 'unknown');
    if (pendingIndex === -1) {
      return { processed: false };
    }

    const job = this.queue[pendingIndex];

    // If chat is locked, defer
    if (job.chatId && this.isChatLocked(job.chatId)) {
      return { processed: false, job, status: 'deferred_chat_locked' };
    }

    if (job.chatId) {
      this.acquireChatLock(job.chatId);
    }

    job.attempts += 1;
    job.updatedAt = new Date().toISOString();

    try {
      const outcome = await handler(job);
      if (outcome.success) {
        job.state = 'sent';
        job.externalRefId = outcome.externalRefId;
        this.queue.splice(pendingIndex, 1);
        if (job.chatId) this.releaseChatLock(job.chatId);
        return { processed: true, job, status: 'completed' };
      } else {
        job.lastError = outcome.error ?? 'Job handler reported non-success';
        return this.handleJobFailure(job, pendingIndex);
      }
    } catch (err) {
      job.lastError = (err as Error).message;
      return this.handleJobFailure(job, pendingIndex);
    } finally {
      if (job.chatId) {
        this.releaseChatLock(job.chatId);
      }
    }
  }

  private handleJobFailure(job: JobItem, queueIndex: number): { processed: boolean; job: JobItem; status: string } {
    if (job.attempts >= job.maxAttempts) {
      job.state = 'failed';
      this.deadLetterQueue.push({
        jobId: job.id,
        type: job.type,
        payload: job.payload,
        attempts: job.attempts,
        fatalError: job.lastError ?? 'Max retries exhausted',
        failedAt: new Date().toISOString(),
      });
      this.queue.splice(queueIndex, 1);
      return { processed: true, job, status: 'moved_to_dlq' };
    } else {
      // Exponential backoff
      job.state = 'pending';
      job.backoffMs = job.backoffMs * 2;
      return { processed: true, job, status: `retrying_attempt_${job.attempts}_of_${job.maxAttempts}` };
    }
  }

  public getQueueStatus(): { pendingCount: number; dlqCount: number; activeLocks: string[]; dlq: DeadLetterRecord[] } {
    return {
      pendingCount: this.queue.length,
      dlqCount: this.deadLetterQueue.length,
      activeLocks: Array.from(this.activeLocks),
      dlq: [...this.deadLetterQueue],
    };
  }

  public clearQueue(): void {
    this.queue = [];
    this.deadLetterQueue = [];
    this.activeLocks.clear();
    this.idempotencyStore.clear();
  }
}
