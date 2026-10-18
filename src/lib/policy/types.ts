export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'modified_and_approved';

export interface PendingApproval {
  id: string;
  agentId: string;
  contactId: string;
  actionType: string;
  riskLevel: RiskLevel;
  riskReason: string;
  proposedPayload: Record<string, unknown>;
  status: ApprovalStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  modifiedPayload?: Record<string, unknown>;
}

export interface KillSwitchState {
  isGloballyFrozen: boolean;
  frozenAgents: Set<string>;
  frozenContacts: Set<string>;
  freezeReason?: string;
}

export interface RateLimitConfig {
  maxOutboundPerHour: number;
  minJitterMs: number;
  maxJitterMs: number;
}
