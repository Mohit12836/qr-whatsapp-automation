import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentAccount: vi.fn(),
  requireRole: vi.fn(),
  loadTenantPolicyResult: vi.fn(),
  saveTenantPolicy: vi.fn(),
}));

vi.mock('@/lib/auth/account', () => ({
  getCurrentAccount: mocks.getCurrentAccount,
  requireRole: mocks.requireRole,
  toErrorResponse: vi.fn((err: unknown) => {
    const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
    const message = err instanceof Error ? err.message : 'Internal error';
    return Response.json({ error: message }, { status });
  }),
}));

vi.mock('@/lib/ai/policy-service', () => ({
  loadTenantPolicyResult: mocks.loadTenantPolicyResult,
  saveTenantPolicy: mocks.saveTenantPolicy,
}));

import { GET, POST } from './route';

describe('/api/ai/policies API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET Policy', () => {
    it('allows any authenticated workspace member to read policy', async () => {
      mocks.getCurrentAccount.mockResolvedValueOnce({
        supabase: {},
        accountId: 'acc-tenant-100',
        userId: 'usr-member-1',
        role: 'viewer',
      });

      mocks.loadTenantPolicyResult.mockResolvedValueOnce({
        success: true,
        policy: {
          accountId: 'acc-tenant-100',
          currency: 'INR',
          maxDiscountPercentage: 10.0,
          version: 1,
        },
        isDefault: false,
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isDefault).toBe(false);
      expect(json.policy.maxDiscountPercentage).toBe(10.0);
    });

    it('returns 401 if unauthenticated', async () => {
      const authErr = Object.assign(new Error('Unauthorized'), { status: 401 });
      mocks.getCurrentAccount.mockRejectedValueOnce(authErr);

      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('returns 500 when database fails to load policy', async () => {
      mocks.getCurrentAccount.mockResolvedValueOnce({
        supabase: {},
        accountId: 'acc-tenant-100',
        userId: 'usr-member-1',
        role: 'agent',
      });

      mocks.loadTenantPolicyResult.mockResolvedValueOnce({
        success: false,
        error: 'Database connection failed',
        errorCode: 'DB_ERROR',
        policy: null,
      });

      const res = await GET();
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errorCode).toBe('DB_ERROR');
    });
  });

  describe('POST Policy', () => {
    it('allows admin / owner to update policy', async () => {
      mocks.requireRole.mockResolvedValueOnce({
        accountId: 'acc-tenant-100',
        userId: 'usr-admin-1',
        role: 'admin',
      });

      mocks.saveTenantPolicy.mockResolvedValueOnce({
        success: true,
        version: 2,
        auditId: 'aud-test-999',
        policy: {
          accountId: 'acc-tenant-100',
          currency: 'INR',
          maxDiscountPercentage: 15.0,
          version: 2,
        },
      });

      const req = new Request('http://localhost/api/ai/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'INR',
          maxDiscountPercentage: 15.0,
          allowAutonomousDiscounts: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.version).toBe(2);
      expect(json.auditId).toBe('aud-test-999');
      expect(json.policy.maxDiscountPercentage).toBe(15.0);
    });

    it('returns 403 Forbidden if non-admin attempts to modify policy', async () => {
      const forbErr = Object.assign(new Error('Forbidden'), { status: 403 });
      mocks.requireRole.mockRejectedValueOnce(forbErr);

      const req = new Request('http://localhost/api/ai/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxDiscountPercentage: 20.0 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('returns 400 Bad Request on invalid currency validation error', async () => {
      mocks.requireRole.mockResolvedValueOnce({
        accountId: 'acc-tenant-100',
        userId: 'usr-admin-1',
        role: 'admin',
      });

      mocks.saveTenantPolicy.mockResolvedValueOnce({
        success: false,
        error: 'Unsupported currency',
        errorCode: 'INVALID_CURRENCY',
      });

      const req = new Request('http://localhost/api/ai/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: 'BTC' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.errorCode).toBe('INVALID_CURRENCY');
    });

    it('returns 500 on database failure during save', async () => {
      mocks.requireRole.mockResolvedValueOnce({
        accountId: 'acc-tenant-100',
        userId: 'usr-admin-1',
        role: 'admin',
      });

      mocks.saveTenantPolicy.mockResolvedValueOnce({
        success: false,
        error: 'Database transaction failed',
        errorCode: 'DB_ERROR',
      });

      const req = new Request('http://localhost/api/ai/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxDiscountPercentage: 10.0 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.errorCode).toBe('DB_ERROR');
    });
  });
});
