import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadTenantPolicyResult,
  loadTenantPolicy,
  saveTenantPolicy,
  mapDbRowToPolicy,
  isSupportedCurrency,
  SUPPORTED_CURRENCIES,
} from './policy-service';

const mocks = vi.hoisted(() => ({
  adminRpc: vi.fn(),
  adminFrom: vi.fn(),
}));

vi.mock('@/lib/ai/admin-client', () => ({
  supabaseAdmin: () => ({
    rpc: mocks.adminRpc,
    from: mocks.adminFrom,
  }),
}));

describe('AI Business Policy Service (Security & Integrity Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Currency Validation & Allowlist', () => {
    it('accepts valid supported ISO 4217 currencies', () => {
      expect(isSupportedCurrency('INR')).toBe(true);
      expect(isSupportedCurrency('inr')).toBe(true);
      expect(isSupportedCurrency('USD')).toBe(true);
      expect(isSupportedCurrency('EUR')).toBe(true);
      expect(isSupportedCurrency('AED')).toBe(true);
      expect(isSupportedCurrency('SAR')).toBe(true);
      expect(SUPPORTED_CURRENCIES).toContain('INR');
    });

    it('rejects unsupported or arbitrary currency codes', () => {
      expect(isSupportedCurrency('XYZ')).toBe(false);
      expect(isSupportedCurrency('RUPEES')).toBe(false);
      expect(isSupportedCurrency('123')).toBe(false);
      expect(isSupportedCurrency('')).toBe(false);
    });
  });

  describe('2. DB Failure vs. Missing Policy Row', () => {
    it('returns fail-closed defaults with isDefault=true when row is missing from DB', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      };

      const res = await loadTenantPolicyResult(mockDb as unknown as Parameters<typeof loadTenantPolicyResult>[0], 'acc-tenant-missing');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.isDefault).toBe(true);
        expect(res.policy.accountId).toBe('acc-tenant-missing');
        expect(res.policy.currency).toBe('INR');
        expect(res.policy.maxDiscountPercentage).toBe(0.0);
        expect(res.policy.allowAutonomousDiscounts).toBe(false);
        expect(res.policy.allowAutonomousPaymentLinks).toBe(false);
      }
    });

    it('returns explicit DB_ERROR failure when database query fails', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection refused', code: '500' } }),
            }),
          }),
        }),
      };

      const res = await loadTenantPolicyResult(mockDb as unknown as Parameters<typeof loadTenantPolicyResult>[0], 'acc-tenant-123');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.errorCode).toBe('DB_ERROR');
        expect(res.error).toContain('Failed to load policy');
      }

      // Runtime getter throws on DB failure
      await expect(loadTenantPolicy(mockDb as unknown as Parameters<typeof loadTenantPolicy>[0], 'acc-tenant-123')).rejects.toThrow('DB_ERROR');
    });

    it('successfully loads existing custom policy row from DB', async () => {
      const mockDb = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  currency: 'AED',
                  max_discount_percentage: 12.0,
                  allow_autonomous_discounts: true,
                  version: 4,
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const res = await loadTenantPolicyResult(mockDb as unknown as Parameters<typeof loadTenantPolicyResult>[0], 'acc-tenant-123');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.isDefault).toBe(false);
        expect(res.policy.currency).toBe('AED');
        expect(res.policy.maxDiscountPercentage).toBe(12.0);
        expect(res.policy.version).toBe(4);
      }
    });
  });

  describe('3. saveTenantPolicy Validation & Atomic Audit/Version', () => {
    it('successfully persists policy and captures auditId and new version', async () => {
      mocks.adminRpc.mockResolvedValueOnce({
        data: {
          success: true,
          version: 5,
          audit_id: 'aud-uuid-777',
          policy: {
            account_id: 'acc-tenant-123',
            currency: 'USD',
            max_discount_percentage: 20.0,
            min_order_amount: 50.0,
            max_autonomous_payment_amount: 10000.0,
            allow_autonomous_discounts: true,
            allow_autonomous_payment_links: true,
            allow_autonomous_booking: false,
            require_human_approval_for_refunds: true,
            require_human_approval_for_cancellations: true,
            require_human_approval_for_data_deletion: true,
            version: 5,
          },
        },
        error: null,
      });

      const res = await saveTenantPolicy('acc-tenant-123', 'usr-admin-1', {
        currency: 'usd',
        maxDiscountPercentage: 20.0,
        minOrderAmount: 50.0,
        maxAutonomousPaymentAmount: 10000.0,
        allowAutonomousDiscounts: true,
        allowAutonomousPaymentLinks: true,
      });

      expect(res.success).toBe(true);
      expect(res.version).toBe(5);
      expect(res.auditId).toBe('aud-uuid-777');
      expect(res.policy?.currency).toBe('USD');

      expect(mocks.adminRpc).toHaveBeenCalledWith('upsert_ai_business_policy_atomic', {
        p_account_id: 'acc-tenant-123',
        p_user_id: 'usr-admin-1',
        p_currency: 'USD',
        p_max_discount: 20.0,
        p_min_order: 50.0,
        p_max_payment: 10000.0,
        p_allow_discounts: true,
        p_allow_payments: true,
        p_allow_booking: false,
        p_require_refund_approval: true,
        p_require_cancel_approval: true,
        p_require_deletion_approval: true,
        p_confirmed_by_phone: 'web_dashboard',
      });
    });

    it('rejects unsupported currency with INVALID_CURRENCY error code', async () => {
      const res = await saveTenantPolicy('acc-tenant-123', 'usr-admin-1', {
        currency: 'BTC',
      });

      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('INVALID_CURRENCY');
      expect(mocks.adminRpc).not.toHaveBeenCalled();
    });

    it('rejects invalid or negative numeric inputs', async () => {
      const negDiscount = await saveTenantPolicy('acc-tenant-123', 'usr-admin-1', { maxDiscountPercentage: -1 });
      expect(negDiscount.errorCode).toBe('INVALID_DISCOUNT');

      const overDiscount = await saveTenantPolicy('acc-tenant-123', 'usr-admin-1', { maxDiscountPercentage: 101 });
      expect(overDiscount.errorCode).toBe('INVALID_DISCOUNT');

      const negMinOrder = await saveTenantPolicy('acc-tenant-123', 'usr-admin-1', { minOrderAmount: -5 });
      expect(negMinOrder.errorCode).toBe('INVALID_MIN_ORDER');

      const negMaxPayment = await saveTenantPolicy('acc-tenant-123', 'usr-admin-1', { maxAutonomousPaymentAmount: -100 });
      expect(negMaxPayment.errorCode).toBe('INVALID_MAX_PAYMENT');
    });

    it('propagates RPC database error when audit or update fails', async () => {
      mocks.adminRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'audit insert failed' },
      });

      const res = await saveTenantPolicy('acc-tenant-123', 'usr-admin-1', {
        currency: 'INR',
        maxDiscountPercentage: 10.0,
      });

      expect(res.success).toBe(false);
      expect(res.errorCode).toBe('DB_ERROR');
    });
  });

  describe('4. mapDbRowToPolicy fallback handling', () => {
    it('gracefully handles missing or unparseable database values', () => {
      const emptyRow = {};
      const policy = mapDbRowToPolicy(emptyRow, 'acc-tenant-123');

      expect(policy.currency).toBe('INR');
      expect(policy.maxDiscountPercentage).toBe(0);
      expect(policy.minOrderAmount).toBe(1);
      expect(policy.maxAutonomousPaymentAmount).toBe(0);
      expect(policy.allowAutonomousDiscounts).toBe(false);
      expect(policy.allowAutonomousPaymentLinks).toBe(false);
      expect(policy.version).toBe(1);
    });
  });
});
