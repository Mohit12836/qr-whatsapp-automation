import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isFounderEmail } from '@/lib/auth/founder';

function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isFounderEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden: Founder access only' }, { status: 403 });
    }

    const db = supabaseAdmin();

    const [accountsRes, profilesRes, waRes, aiRes, contactsRes, convsRes] = await Promise.all([
      db.from('accounts').select('id, name, created_at').order('created_at', { ascending: false }),
      db.from('profiles').select('id, user_id, full_name, email, account_id, account_role'),
      db.from('whatsapp_config').select('account_id, phone_number_id, waba_id, status, connected_at'),
      db.from('ai_configs').select('account_id, provider, model, is_active, auto_reply_enabled'),
      db.from('contacts').select('account_id'),
      db.from('conversations').select('account_id'),
    ]);

    const accounts = accountsRes.data || [];
    const profiles = profilesRes.data || [];
    const waConfigs = waRes.data || [];
    const aiConfigs = aiRes.data || [];
    const contacts = contactsRes.data || [];
    const conversations = convsRes.data || [];

    const tenants = accounts.map((acc) => {
      const ownerProfile =
        profiles.find((p) => p.account_id === acc.id && p.account_role === 'owner') ||
        profiles.find((p) => p.account_id === acc.id);
      const wa = waConfigs.find((w) => w.account_id === acc.id);
      const ai = aiConfigs.find((a) => a.account_id === acc.id);
      const contactCount = contacts.filter((c) => c.account_id === acc.id).length;
      const convCount = conversations.filter((c) => c.account_id === acc.id).length;

      return {
        id: acc.id,
        name: acc.name || ownerProfile?.full_name || 'Unnamed Store',
        ownerEmail: ownerProfile?.email || 'No email',
        ownerName: ownerProfile?.full_name || 'Owner',
        createdAt: acc.created_at,
        whatsappConnected: wa?.status === 'connected',
        phoneNumberId: wa?.phone_number_id || null,
        wabaId: wa?.waba_id || null,
        aiActive: Boolean(ai?.is_active),
        botPaused: ai ? !ai.auto_reply_enabled : false,
        aiModel: ai?.model || 'Not configured',
        contactCount,
        conversationCount: convCount,
      };
    });

    return NextResponse.json({
      tenants,
      summary: {
        totalTenants: tenants.length,
        connectedWabas: tenants.filter((t) => t.whatsappConnected).length,
        activeBots: tenants.filter((t) => t.aiActive && !t.botPaused).length,
        totalContacts: contacts.length,
        totalConversations: conversations.length,
      },
    });
  } catch (err) {
    console.error('Superadmin tenants GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isFounderEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden: Founder access only' }, { status: 403 });
    }

    const { accountId, botPaused } = await req.json();
    if (!accountId || typeof botPaused !== 'boolean') {
      return NextResponse.json({ error: 'accountId and botPaused are required' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { error } = await db
      .from('ai_configs')
      .update({ auto_reply_enabled: !botPaused })
      .eq('account_id', accountId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, accountId, botPaused });
  } catch (err) {
    console.error('Superadmin tenants PATCH error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
