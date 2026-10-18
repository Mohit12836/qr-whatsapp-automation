import { describe, it, expect, beforeEach } from 'vitest';
import { ResilientQueueEngine } from './resilient-queue';

describe('ResilientQueueEngine', () => {
  let engine: ResilientQueueEngine;

  beforeEach(() => {
    engine = new ResilientQueueEngine({ idempotencyTtlMs: 5000 });
    engine.clearQueue();
  });

  describe('1. Idempotency & Deduplication', () => {
    it('claims a new idempotency key on first sight', () => {
      const res1 = engine.checkAndClaimIdempotency('event_123');
      expect(res1.isDuplicate).toBe(false);

      // Second sight must be detected as duplicate
      const res2 = engine.checkAndClaimIdempotency('event_123');
      expect(res2.isDuplicate).toBe(true);
      expect(res2.previousRecord?.status).toBe('processing');
    });

    it('marks idempotency as completed with payload result', () => {
      engine.checkAndClaimIdempotency('order_456');
      engine.completeIdempotency('order_456', { orderId: 'ord_999' });

      const res = engine.checkAndClaimIdempotency('order_456');
      expect(res.isDuplicate).toBe(true);
      expect(res.previousRecord?.status).toBe('completed');
      expect(res.previousRecord?.result).toEqual({ orderId: 'ord_999' });
    });
  });

  describe('2. Per-Chat Concurrency Lock', () => {
    it('locks a chat exclusively and prevents concurrent operations', () => {
      const lock1 = engine.acquireChatLock('919876543210');
      expect(lock1).toBe(true);
      expect(engine.isChatLocked('919876543210')).toBe(true);

      // Second attempt on same chat fails
      const lock2 = engine.acquireChatLock('919876543210');
      expect(lock2).toBe(false);

      // Releasing lock allows subsequent acquisition
      engine.releaseChatLock('919876543210');
      expect(engine.isChatLocked('919876543210')).toBe(false);

      const lock3 = engine.acquireChatLock('919876543210');
      expect(lock3).toBe(true);
    });
  });

  describe('3. 4-State Execution & Verification Check', () => {
    it('returns sent status on normal successful execution', async () => {
      const res = await engine.executeWithVerification({
        actionName: 'send_whatsapp_message',
        execute: async () => ({ success: true, externalRefId: 'wamid.12345' }),
        verify: async () => ({ verified: true, state: 'sent' }),
      });

      expect(res.state).toBe('sent');
      expect(res.externalRefId).toBe('wamid.12345');
    });

    it('resolves ambiguous crash to verified sent if external state confirmed', async () => {
      const res = await engine.executeWithVerification({
        actionName: 'send_whatsapp_quote',
        execute: async () => {
          // Simulated scenario: external WhatsApp API received message, but local network timed out
          throw new Error('Local socket timeout during response read');
        },
        verify: async () => {
          // Verification query confirms message actually landed on provider
          return { verified: true, state: 'sent' };
        },
      });

      expect(res.state).toBe('sent');
      expect(res.message).toContain('External state verified as sent');
    });

    it('flags state as unknown when verification is inconclusive (prevents duplicate charging)', async () => {
      const res = await engine.executeWithVerification({
        actionName: 'charge_razorpay_customer',
        execute: async () => {
          throw new Error('Gateway Connection Refused');
        },
        verify: async () => {
          throw new Error('Status check endpoint unreachable');
        },
      });

      expect(res.state).toBe('unknown');
      expect(res.message).toContain('Execution reached UNKNOWN state');
    });
  });

  describe('4. Resilient Job Queue & DLQ', () => {
    it('enqueues and processes a successful job', async () => {
      engine.enqueueJob({
        type: 'send_followup',
        payload: { to: '919876543210', text: 'Hello!' },
        chatId: '919876543210',
      });

      const outcome = await engine.processNextJob(async (job) => {
        expect(job.type).toBe('send_followup');
        return { success: true, externalRefId: 'wamid.OK' };
      });

      expect(outcome.processed).toBe(true);
      expect(outcome.status).toBe('completed');
      expect(engine.getQueueStatus().pendingCount).toBe(0);
    });

    it('defers job if chat is currently locked by another worker', async () => {
      engine.acquireChatLock('919999999999');

      engine.enqueueJob({
        type: 'auto_reply',
        payload: { text: 'Welcome' },
        chatId: '919999999999',
      });

      const outcome = await engine.processNextJob(async () => ({ success: true }));
      expect(outcome.processed).toBe(false);
      expect(outcome.status).toBe('deferred_chat_locked');
    });

    it('retries with backoff and moves to DLQ when max attempts exhausted', async () => {
      engine.enqueueJob({
        type: 'failing_action',
        payload: { test: true },
        maxAttempts: 2,
        initialBackoffMs: 100,
      });

      // Attempt 1: fail and retry
      const outcome1 = await engine.processNextJob(async () => {
        return { success: false, error: 'Database disconnected' };
      });
      expect(outcome1.status).toBe('retrying_attempt_1_of_2');
      expect(engine.getQueueStatus().pendingCount).toBe(1);
      expect(engine.getQueueStatus().dlqCount).toBe(0);

      // Attempt 2: fail and move to DLQ
      const outcome2 = await engine.processNextJob(async () => {
        return { success: false, error: 'Database disconnected permanently' };
      });
      expect(outcome2.status).toBe('moved_to_dlq');
      expect(engine.getQueueStatus().pendingCount).toBe(0);
      expect(engine.getQueueStatus().dlqCount).toBe(1);
      expect(engine.getQueueStatus().dlq[0].fatalError).toBe('Database disconnected permanently');
    });
  });
});
