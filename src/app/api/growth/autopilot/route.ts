import { NextRequest, NextResponse } from 'next/server';
import { AutopilotEngine } from '@/lib/autopilot/autopilot-engine';
import { TenantAutopilotProfile, AuthorityPostTemplate } from '@/lib/autopilot/types';

// Singleton instance of the AutopilotEngine
const autopilotEngine = new AutopilotEngine();

const VPS_BRIDGE_URL = process.env.WA_BRIDGE_URL || 'http://72.61.232.114:3001';

/**
 * Universal publisher function that dispatches content to WhatsApp Channel or Group via the VPS bridge.
 */
async function publishToWhatsAppBridge(destinationJid: string, text: string): Promise<boolean> {
  const isChannel = destinationJid.endsWith('@newsletter');
  const endpoint = isChannel 
    ? `${VPS_BRIDGE_URL}/channel/send` 
    : `${VPS_BRIDGE_URL}/group/send`;

  const payload = isChannel
    ? { channelJid: destinationJid, message: text }
    : { groupId: destinationJid, message: text };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Autopilot Bridge Error] HTTP ${res.status}: ${errText}`);
      return false;
    }

    const data = await res.json();
    return !!(data.success || data.messageId || data.status === 'ok');
  } catch (error) {
    console.error('[Autopilot Bridge Exception]:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (tenantId) {
      const tenant = autopilotEngine.getTenant(tenantId);
      if (!tenant) {
        return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
      }
      const morningPreview = autopilotEngine.generateDailyPost(tenantId, 'morning_value');
      const eveningPreview = autopilotEngine.generateDailyPost(tenantId, 'evening_hook');

      return NextResponse.json({
        success: true,
        tenant,
        previews: {
          morning_value: morningPreview,
          evening_hook: eveningPreview,
        },
      });
    }

    const tenants = autopilotEngine.getAllTenants();
    return NextResponse.json({
      success: true,
      count: tenants.length,
      tenants: tenants.map(t => ({
        ...t,
        nextSlotPreview: autopilotEngine.generateDailyPost(t.id, 'morning_value'),
      })),
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Register a new tenant (User or Friend / SaaS client)
    if (action === 'register_tenant') {
      const profileData: Omit<TenantAutopilotProfile, 'createdAt' | 'updatedAt' | 'stats'> = body.tenant;
      if (!profileData || !profileData.id || !profileData.businessName || !profileData.phone) {
        return NextResponse.json({
          success: false,
          error: 'Missing required tenant fields: id, businessName, phone',
        }, { status: 400 });
      }

      const registered = autopilotEngine.registerTenant(profileData);
      return NextResponse.json({ success: true, tenant: registered });
    }

    // 2. Update schedule or toggle active state
    if (action === 'update_schedule') {
      const { tenantId, schedule } = body;
      if (!tenantId || !schedule) {
        return NextResponse.json({ success: false, error: 'tenantId and schedule are required' }, { status: 400 });
      }

      const updated = autopilotEngine.updateTenantSchedule(tenantId, schedule);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, tenant: autopilotEngine.getTenant(tenantId) });
    }

    // 3. Trigger immediate Autopilot Execution (e.g. Test Run or Cron trigger)
    if (action === 'trigger_run') {
      const { tenantId, slot = 'morning_value' } = body;
      if (!tenantId) {
        return NextResponse.json({ success: false, error: 'tenantId is required' }, { status: 400 });
      }

      const result = await autopilotEngine.executeAutopilotRun(
        tenantId,
        slot,
        publishToWhatsAppBridge
      );

      return NextResponse.json({ success: result.status === 'sent', result });
    }

    // 4. Preview Post without publishing
    if (action === 'preview_post') {
      const { tenantId, slot = 'morning_value' } = body;
      const preview = autopilotEngine.generateDailyPost(tenantId, slot);
      return NextResponse.json({ success: true, preview });
    }

    // 5. Add Custom Content Pillar / Post Template
    if (action === 'add_pillar') {
      const { tenantId, pillar } = body as { tenantId: string; pillar: AuthorityPostTemplate };
      const tenant = autopilotEngine.getTenant(tenantId);
      if (!tenant) {
        return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
      }

      tenant.customPillars.push(pillar);
      tenant.updatedAt = new Date().toISOString();
      return NextResponse.json({ success: true, tenant });
    }

    return NextResponse.json({ success: false, error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
