import {
  PendingApproval,
  RiskLevel,
  ApprovalStatus,
  KillSwitchState,
  RateLimitConfig,
} from './types';

export class PolicyGuardEngine {
  private approvals: Map<string, PendingApproval> = new Map();
  private killSwitch: KillSwitchState = {
    isGloballyFrozen: false,
    frozenAgents: new Set(),
    frozenContacts: new Set(),
  };

  private outboundTimestamps: number[] = [];
  private rateConfig: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.rateConfig = {
      maxOutboundPerHour: config?.maxOutboundPerHour ?? 120,
      minJitterMs: config?.minJitterMs ?? 2000,
      maxJitterMs: config?.maxJitterMs ?? 7000,
    };
  }

  // -------------------------------------------------------------
  // 1. Kill Switch & Freeze Controls
  // -------------------------------------------------------------
  public freezeAll(reason: string = 'Emergency stop triggered by admin'): void {
    this.killSwitch.isGloballyFrozen = true;
    this.killSwitch.freezeReason = reason;
  }

  public unfreezeAll(): void {
    this.killSwitch.isGloballyFrozen = false;
    this.killSwitch.freezeReason = undefined;
  }

  public freezeContact(contactId: string): void {
    this.killSwitch.frozenContacts.add(contactId);
  }

  public unfreezeContact(contactId: string): void {
    this.killSwitch.frozenContacts.delete(contactId);
  }

  public freezeAgent(agentId: string): void {
    this.killSwitch.frozenAgents.add(agentId);
  }

  public unfreezeAgent(agentId: string): void {
    this.killSwitch.frozenAgents.delete(agentId);
  }

  public isExecutionPermitted(agentId: string, contactId: string): { permitted: boolean; reason?: string } {
    if (this.killSwitch.isGloballyFrozen) {
      return { permitted: false, reason: `System Frozen: ${this.killSwitch.freezeReason}` };
    }
    if (this.killSwitch.frozenAgents.has(agentId)) {
      return { permitted: false, reason: `Agent '${agentId}' is halted by safety policy.` };
    }
    if (this.killSwitch.frozenContacts.has(contactId)) {
      return { permitted: false, reason: `Conversation '${contactId}' is frozen or handed off to human agent.` };
    }
    return { permitted: true };
  }

  // -------------------------------------------------------------
  // 2. Risk Assessment & Human Review Queue
  // -------------------------------------------------------------
  public assessActionRisk(actionType: string, payload: Record<string, unknown>): { riskLevel: RiskLevel; requiresApproval: boolean; reason: string } {
    // Financial / Payment links
    if (actionType === 'create_payment_link') {
      const amount = Number(payload.amount || 0);
      if (amount > 10000) {
        return {
          riskLevel: 'high',
          requiresApproval: true,
          reason: `High value transaction: ₹${amount} exceeds autonomous threshold of ₹10,000`,
        };
      }
    }

    // High discounts
    if (actionType === 'apply_discount') {
      const discountPct = Number(payload.discountPercent || 0);
      if (discountPct > 15) {
        return {
          riskLevel: 'high',
          requiresApproval: true,
          reason: `Discount of ${discountPct}% exceeds autonomous 15% ceiling`,
        };
      }
    }

    // Mass Broadcast
    if (actionType === 'send_broadcast') {
      return {
        riskLevel: 'high',
        requiresApproval: true,
        reason: 'Outbound broadcast messages always require human sign-off to ensure anti-ban compliance',
      };
    }

    return {
      riskLevel: 'low',
      requiresApproval: false,
      reason: 'Standard benign informational response',
    };
  }

  public submitForApproval(params: {
    agentId: string;
    contactId: string;
    actionType: string;
    riskLevel: RiskLevel;
    riskReason: string;
    proposedPayload: Record<string, unknown>;
  }): PendingApproval {
    const id = `appr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const approval: PendingApproval = {
      id,
      agentId: params.agentId,
      contactId: params.contactId,
      actionType: params.actionType,
      riskLevel: params.riskLevel,
      riskReason: params.riskReason,
      proposedPayload: params.proposedPayload,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    this.approvals.set(id, approval);
    return approval;
  }

  public approve(id: string, reviewerId: string): { success: boolean; approval?: PendingApproval } {
    const item = this.approvals.get(id);
    if (!item || item.status !== 'pending') return { success: false };

    item.status = 'approved';
    item.reviewedBy = reviewerId;
    item.reviewedAt = new Date().toISOString();
    return { success: true, approval: item };
  }

  public reject(id: string, reviewerId: string, reason: string): { success: boolean; approval?: PendingApproval } {
    const item = this.approvals.get(id);
    if (!item || item.status !== 'pending') return { success: false };

    item.status = 'rejected';
    item.reviewedBy = reviewerId;
    item.reviewedAt = new Date().toISOString();
    item.rejectionReason = reason;
    return { success: true, approval: item };
  }

  public modifyAndApprove(id: string, reviewerId: string, modifiedPayload: Record<string, unknown>): { success: boolean; approval?: PendingApproval } {
    const item = this.approvals.get(id);
    if (!item || item.status !== 'pending') return { success: false };

    item.status = 'modified_and_approved';
    item.reviewedBy = reviewerId;
    item.reviewedAt = new Date().toISOString();
    item.modifiedPayload = modifiedPayload;
    return { success: true, approval: item };
  }

  public getPendingApprovals(): PendingApproval[] {
    return Array.from(this.approvals.values()).filter(a => a.status === 'pending');
  }

  // -------------------------------------------------------------
  // 3. Anti-Ban Jitter & Rate Limiting
  // -------------------------------------------------------------
  public recordOutboundMessage(): { permitted: boolean; currentHourlyCount: number } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    this.outboundTimestamps = this.outboundTimestamps.filter(t => t > oneHourAgo);

    if (this.outboundTimestamps.length >= this.rateConfig.maxOutboundPerHour) {
      return { permitted: false, currentHourlyCount: this.outboundTimestamps.length };
    }

    this.outboundTimestamps.push(now);
    return { permitted: true, currentHourlyCount: this.outboundTimestamps.length };
  }

  public getHumanJitterDelayMs(): number {
    const min = this.rateConfig.minJitterMs;
    const max = this.rateConfig.maxJitterMs;
    // Humanized jitter with random millisecond distribution
    return Math.floor(min + Math.random() * (max - min));
  }
}
