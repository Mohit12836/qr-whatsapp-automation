import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

describe('Growth Autopilot API Route (/api/growth/autopilot)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/growth/autopilot returns all seeded tenants with post previews', async () => {
    const req = new NextRequest('http://localhost:3000/api/growth/autopilot');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(data.tenants)).toBe(true);

    const primary = data.tenants.find((t: any) => t.id === 'tenant_anu_krupa');
    expect(primary).toBeDefined();
    expect(primary.businessName).toContain('अनु कृपा ऑनलाइन');
    expect(primary.nextSlotPreview).toBeDefined();
  });

  it('GET /api/growth/autopilot?tenantId=tenant_anu_krupa returns single tenant details with morning & evening previews', async () => {
    const req = new NextRequest('http://localhost:3000/api/growth/autopilot?tenantId=tenant_anu_krupa');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tenant.id).toBe('tenant_anu_krupa');
    expect(data.previews.morning_value.text).toContain('wa.me/918989605297');
    expect(data.previews.evening_hook.text).toBeDefined();
  });

  it('POST with action=preview_post generates formatted preview', async () => {
    const req = new NextRequest('http://localhost:3000/api/growth/autopilot', {
      method: 'POST',
      body: JSON.stringify({
        action: 'preview_post',
        tenantId: 'tenant_anu_krupa',
        slot: 'morning_value',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.preview.text).toContain('अनु कृपा ऑनलाइन');
  });

  it('POST with action=update_schedule updates daily schedule', async () => {
    const req = new NextRequest('http://localhost:3000/api/growth/autopilot', {
      method: 'POST',
      body: JSON.stringify({
        action: 'update_schedule',
        tenantId: 'tenant_anu_krupa',
        schedule: {
          morningPostTime: '08:45',
          isAutoPilotActive: true,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tenant.dailySchedule.morningPostTime).toBe('08:45');
  });

  it('POST with action=register_tenant creates a new business profile', async () => {
    const req = new NextRequest('http://localhost:3000/api/growth/autopilot', {
      method: 'POST',
      body: JSON.stringify({
        action: 'register_tenant',
        tenant: {
          id: 'tenant_test_cafe',
          ownerName: 'Rahul Verma',
          businessName: 'Chai & Co. Cafe',
          phone: '919988776655',
          niche: 'general_business',
          targetGroupJids: [],
          brandVoice: 'Cozy cafe vibes',
          dailySchedule: {
            morningPostTime: '09:00',
            eveningHookTime: '17:00',
            isAutoPilotActive: true,
          },
          customPillars: [],
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tenant.id).toBe('tenant_test_cafe');
    expect(data.tenant.businessName).toBe('Chai & Co. Cafe');
  });

  it('POST with action=trigger_run dispatches post via publisher bridge', async () => {
    // Mock fetch for bridge
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, messageId: 'TEST_MSG_123' }),
    });

    const req = new NextRequest('http://localhost:3000/api/growth/autopilot', {
      method: 'POST',
      body: JSON.stringify({
        action: 'trigger_run',
        tenantId: 'tenant_anu_krupa',
        slot: 'morning_value',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.result.status).toBe('sent');
    expect(data.result.targetDestination).toBe('120363281120066800@newsletter');
  });
});
