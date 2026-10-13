import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  profileSelect: vi.fn(),
  adminRpc: vi.fn(),
  adminFrom: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.authGetUser,
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: mocks.profileSelect,
            }),
          }),
        };
      }
      return {};
    },
  })),
}));

vi.mock('@/lib/ai/admin-client', () => ({
  supabaseAdmin: () => ({
    rpc: mocks.adminRpc,
    from: mocks.adminFrom,
  }),
}));

import { GET, POST, PATCH } from './route';

describe('/api/ai/knowledge/staging API & Atomic Approval Suite', () => {
  const mockUser = { id: 'user-owner-123', email: 'owner@vismart.ai' };
  const mockProfile = { account_id: 'acc-tenant-456', account_role: 'owner' };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mocks.profileSelect.mockResolvedValue({ data: mockProfile, error: null });
  });

  describe('Authentication & Tenant Isolation', () => {
    it('returns 401 if user is not authenticated', async () => {
      mocks.authGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('No session') });
      const res = await GET();
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('returns 403 if profile has no active account', async () => {
      mocks.profileSelect.mockResolvedValueOnce({ data: null, error: new Error('No profile') });
      const res = await GET();
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('No active account found');
    });
  });

  describe('GET Staged Suggestions', () => {
    it('fetches pending rules strictly for the authenticated tenant', async () => {
      const mockStagedList = [
        { id: 'stg-1', extracted_entity: 'Solar 3kW', status: 'pending_confirmation' },
      ];

      const queryMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockStagedList, error: null }),
      };

      mocks.adminFrom.mockReturnValue(queryMock);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.suggestions).toHaveLength(1);
      expect(queryMock.eq).toHaveBeenCalledWith('account_id', 'acc-tenant-456');
      expect(queryMock.eq).toHaveBeenCalledWith('status', 'pending_confirmation');
    });
  });

  describe('POST New Rule Staging', () => {
    it('allows authenticated workspace members to stage suggestions', async () => {
      mocks.adminFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'stg-new', status: 'pending_confirmation' },
              error: null,
            }),
          }),
        }),
      });

      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawMessageText: 'We offer 5 year inverter warranty',
          extractedEntity: 'Warranty',
          extractedAttribute: 'Inverter',
          extractedValue: '5 Years',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.suggestion.id).toBe('stg-new');
    });

    it('rejects POST with missing required fields', async () => {
      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawMessageText: 'Incomplete data' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH Role Authorization & Atomic Execution', () => {
    it('rejects non-owner / non-admin members with 403 Forbidden', async () => {
      mocks.profileSelect.mockResolvedValueOnce({
        data: { account_id: 'acc-tenant-456', account_role: 'member' },
        error: null,
      });

      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stg-1', action: 'approve' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Forbidden');
      expect(mocks.adminRpc).not.toHaveBeenCalled();
    });

    it('allows owner to approve staged rule atomically', async () => {
      mocks.adminRpc.mockResolvedValueOnce({
        data: {
          success: true,
          status: 'confirmed',
          document_id: 'doc-approved-789',
          message: 'Rule approved and activated in live AI sales knowledge base.',
        },
        error: null,
      });

      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stg-1', action: 'approve' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.documentId).toBe('doc-approved-789');

      expect(mocks.adminRpc).toHaveBeenCalledWith('approve_staged_knowledge_atomic', {
        p_staging_id: 'stg-1',
        p_account_id: 'acc-tenant-456',
        p_user_id: 'user-owner-123',
        p_confirmed_by_phone: 'owner@vismart.ai',
        p_override_entity: null,
        p_override_attribute: null,
        p_override_value: null,
      });
    });

    it('allows admin to approve staged rule atomically', async () => {
      mocks.profileSelect.mockResolvedValueOnce({
        data: { account_id: 'acc-tenant-456', account_role: 'admin' },
        error: null,
      });

      mocks.adminRpc.mockResolvedValueOnce({
        data: {
          success: true,
          status: 'confirmed',
          document_id: 'doc-approved-admin-999',
        },
        error: null,
      });

      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stg-1', action: 'approve' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.documentId).toBe('doc-approved-admin-999');
    });

    it('returns 404 when approving a non-existent or cross-tenant staging record', async () => {
      mocks.adminRpc.mockResolvedValueOnce({
        data: {
          success: false,
          error_code: 'NOT_FOUND',
          error: 'Staged rule not found in your workspace',
        },
        error: null,
      });

      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stg-other-tenant', action: 'approve' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain('not found');
    });

    it('returns 409 Conflict when approving an already processed record', async () => {
      mocks.adminRpc.mockResolvedValueOnce({
        data: {
          success: false,
          error_code: 'ALREADY_PROCESSED',
          error: "Rule is already in 'confirmed' state",
        },
        error: null,
      });

      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stg-already-approved', action: 'approve' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain('already in');
    });

    it('rejects viewer and agent roles with 403 Forbidden', async () => {
      for (const unauthorizedRole of ['viewer', 'agent']) {
        mocks.profileSelect.mockResolvedValueOnce({
          data: { account_id: 'acc-tenant-456', account_role: unauthorizedRole },
          error: null,
        });

        const req = new Request('http://localhost/api/ai/knowledge/staging', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'stg-1', action: 'approve' }),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.error).toContain('Forbidden');
      }
      expect(mocks.adminRpc).not.toHaveBeenCalled();
    });

    it('handles concurrent duplicate approval gracefully with 409 conflict', async () => {
      // First call succeeds
      mocks.adminRpc.mockResolvedValueOnce({
        data: { success: true, status: 'confirmed', document_id: 'doc-first-1' },
        error: null,
      });
      // Concurrent second call hits already locked / updated record
      mocks.adminRpc.mockResolvedValueOnce({
        data: { success: false, error_code: 'ALREADY_PROCESSED', error: "Rule is already in 'confirmed' state" },
        error: null,
      });

      const req1 = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stg-concurrent-1', action: 'approve' }),
      });
      const req2 = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stg-concurrent-1', action: 'approve' }),
      });

      const [res1, res2] = await Promise.all([PATCH(req1), PATCH(req2)]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(409);
    });

    it('allows owner to reject/discard rule atomically', async () => {
      mocks.adminRpc.mockResolvedValueOnce({
        data: {
          success: true,
          status: 'rejected',
          message: 'Rule rejected and excluded from AI knowledge base.',
        },
        error: null,
      });

      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'stg-1', action: 'reject' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.status).toBe('rejected');

      expect(mocks.adminRpc).toHaveBeenCalledWith('reject_staged_knowledge_atomic', {
        p_staging_id: 'stg-1',
        p_account_id: 'acc-tenant-456',
        p_user_id: 'user-owner-123',
        p_confirmed_by_phone: 'owner@vismart.ai',
      });
    });

    it('allows owner to edit pending rule content in place', async () => {
      mocks.adminFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'stg-1', extracted_value: 'Updated value 20%' },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const req = new Request('http://localhost/api/ai/knowledge/staging', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'stg-1',
          action: 'edit',
          extractedValue: 'Updated value 20%',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.suggestion.extracted_value).toBe('Updated value 20%');
    });
  });
});
