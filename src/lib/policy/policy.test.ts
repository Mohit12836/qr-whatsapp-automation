import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyGuardEngine } from './policy-guard';

describe('PolicyGuardEngine', () => {
  let policy: PolicyGuardEngine;

  beforeEach(() => {
    policy = new PolicyGuardEngine({
      maxOutboundPerHour: 5,
      minJitterMs: 1000,
      maxJitterMs: 3000,
    });
  });

  describe('Kill Switch & Emergency Freeze', () => {
    it('halts all execution when global freeze is activated', () => {
      expect(policy.isExecutionPermitted('agent_sales', '919876543210').permitted).toBe(true);

      policy.freezeAll('Spike in customer dispute complaints');
      const check = policy.isExecutionPermitted('agent_sales', '919876543210');
      expect(check.permitted).toBe(false);
      expect(check.reason).toContain('System Frozen');

      policy.unfreezeAll();
      expect(policy.isExecutionPermitted('agent_sales', '919876543210').permitted).toBe(true);
    });

    it('freezes specific conversation when handed off to human agent', () => {
      policy.freezeContact('919999888877');

      const contactCheck = policy.isExecutionPermitted('agent_sales', '919999888877');
      expect(contactCheck.permitted).toBe(false);
      expect(contactCheck.reason).toContain('handed off to human agent');

      // Other contacts remain unaffected
      expect(policy.isExecutionPermitted('agent_sales', '919111222333').permitted).toBe(true);
    });
  });

  describe('Risk Assessment & Human Review Queue', () => {
    it('requires human review for payment links exceeding safety threshold', () => {
      const lowCheck = policy.assessActionRisk('create_payment_link', { amount: 1500 });
      expect(lowCheck.requiresApproval).toBe(false);

      const highCheck = policy.assessActionRisk('create_payment_link', { amount: 25000 });
      expect(highCheck.requiresApproval).toBe(true);
      expect(highCheck.riskLevel).toBe('high');
      expect(highCheck.reason).toContain('High value transaction');
    });

    it('requires human review for excessive discounts (>15%)', () => {
      const discountCheck = policy.assessActionRisk('apply_discount', { discountPercent: 25 });
      expect(discountCheck.requiresApproval).toBe(true);
      expect(discountCheck.riskLevel).toBe('high');
    });

    it('supports approval, rejection, and modification workflows in review queue', () => {
      const approval = policy.submitForApproval({
        agentId: 'agent_closer',
        contactId: '919876543210',
        actionType: 'create_payment_link',
        riskLevel: 'high',
        riskReason: 'Amount above ceiling',
        proposedPayload: { amount: 18000 },
      });

      expect(policy.getPendingApprovals().length).toBe(1);

      // Modify and approve
      const result = policy.modifyAndApprove(approval.id, 'manager_mohit', { amount: 15000 });
      expect(result.success).toBe(true);
      expect(result.approval?.status).toBe('modified_and_approved');
      expect(result.approval?.reviewedBy).toBe('manager_mohit');
      expect(result.approval?.modifiedPayload).toEqual({ amount: 15000 });

      // Review queue should now be empty of pending items
      expect(policy.getPendingApprovals().length).toBe(0);
    });
  });

  describe('Anti-Ban Jitter & Rate Limiting', () => {
    it('enforces hourly cap on outbound messages to prevent bans', () => {
      for (let i = 0; i < 5; i++) {
        expect(policy.recordOutboundMessage().permitted).toBe(true);
      }

      // 6th message should breach maxOutboundPerHour: 5
      const breach = policy.recordOutboundMessage();
      expect(breach.permitted).toBe(false);
      expect(breach.currentHourlyCount).toBe(5);
    });

    it('generates randomized human-like jitter delays within bounds', () => {
      const delay = policy.getHumanJitterDelayMs();
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(3000);
    });
  });
});
