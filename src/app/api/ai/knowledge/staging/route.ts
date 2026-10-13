import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/ai/admin-client';

interface StagingActionBody {
  id: string;
  action: 'approve' | 'reject' | 'edit' | 'discard';
  extractedEntity?: string;
  extractedAttribute?: string;
  extractedValue?: string;
}

interface StagingCreateBody {
  rawMessageText: string;
  extractedEntity: string;
  extractedAttribute?: string;
  extractedValue: string;
  confidenceScore?: number;
  senderPhone?: string;
}

const PRIVILEGED_ROLES = ['owner', 'admin'];

// 1. GET — List all pending knowledge suggestions for the authenticated tenant
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve tenant account_id
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .single();

    if (profError || !profile?.account_id) {
      return NextResponse.json({ success: false, error: 'No active account found' }, { status: 403 });
    }

    const adminDb = supabaseAdmin();
    const { data: stagedItems, error: fetchError } = await adminDb
      .from('temp_knowledge_staging')
      .select('*')
      .eq('account_id', profile.account_id)
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[Staging API] fetch failed:', fetchError);
      return NextResponse.json({ success: false, error: 'Failed to fetch staged rules' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      suggestions: stagedItems || [],
    });
  } catch (error) {
    console.error('[Staging API] GET unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST — Create a new staged knowledge rule suggestion (pending confirmation)
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ success: false, error: 'No active account found' }, { status: 403 });
    }

    const body: StagingCreateBody = await req.json().catch(() => ({}));
    const {
      rawMessageText,
      extractedEntity,
      extractedAttribute = 'General Rule',
      extractedValue,
      confidenceScore = 0.95,
      senderPhone = 'system_extraction',
    } = body;

    if (!rawMessageText || !extractedEntity || !extractedValue) {
      return NextResponse.json(
        { success: false, error: 'rawMessageText, extractedEntity, and extractedValue are required' },
        { status: 400 }
      );
    }

    const adminDb = supabaseAdmin();
    const { data: inserted, error: insertError } = await adminDb
      .from('temp_knowledge_staging')
      .insert({
        account_id: profile.account_id,
        sender_phone: senderPhone,
        raw_message_text: rawMessageText,
        extracted_entity: extractedEntity,
        extracted_attribute: extractedAttribute,
        extracted_value: extractedValue,
        confidence_score: confidenceScore,
        status: 'pending_confirmation',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Staging API] insert failed:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to stage rule' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      suggestion: inserted,
    });
  } catch (error) {
    console.error('[Staging API] POST unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// 3. PATCH — Edit, Approve, or Reject a staged suggestion (Restricted to Owner/Admin)
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ success: false, error: 'No active account found' }, { status: 403 });
    }

    // Role-based authorization: Only owner or admin may mutate staging records
    const isAuthorized = PRIVILEGED_ROLES.includes(profile.account_role);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only account owners and admins can approve, edit, or reject knowledge' },
        { status: 403 }
      );
    }

    const body: StagingActionBody = await req.json().catch(() => ({}));
    const { id, action, extractedEntity, extractedAttribute, extractedValue } = body;

    if (!id || !action || !['approve', 'reject', 'discard', 'edit'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Valid id and action are required' }, { status: 400 });
    }

    const adminDb = supabaseAdmin();

    // ACTION: EDIT
    if (action === 'edit') {
      const updates: Record<string, unknown> = {};
      if (extractedEntity !== undefined) updates.extracted_entity = extractedEntity;
      if (extractedAttribute !== undefined) updates.extracted_attribute = extractedAttribute;
      if (extractedValue !== undefined) updates.extracted_value = extractedValue;

      const { data: updated, error: updateErr } = await adminDb
        .from('temp_knowledge_staging')
        .update(updates)
        .eq('id', id)
        .eq('account_id', profile.account_id)
        .eq('status', 'pending_confirmation')
        .select()
        .single();

      if (updateErr || !updated) {
        return NextResponse.json(
          { success: false, error: 'Failed to update staged rule or rule is no longer pending' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, suggestion: updated });
    }

    // ACTION: REJECT / DISCARD (Atomic RPC)
    if (action === 'reject' || action === 'discard') {
      const { data: rpcRes, error: rpcErr } = await adminDb.rpc('reject_staged_knowledge_atomic', {
        p_staging_id: id,
        p_account_id: profile.account_id,
        p_user_id: user.id,
        p_confirmed_by_phone: user.email || 'web_dashboard',
      });

      if (rpcErr) {
        console.error('[Staging API] reject RPC error:', rpcErr);
        return NextResponse.json({ success: false, error: 'Database error processing rejection' }, { status: 500 });
      }

      if (!rpcRes?.success) {
        const status = rpcRes?.error_code === 'NOT_FOUND' ? 404 : rpcRes?.error_code === 'ALREADY_PROCESSED' ? 409 : 400;
        return NextResponse.json({ success: false, error: rpcRes?.error || 'Failed to reject rule' }, { status });
      }

      return NextResponse.json({
        success: true,
        status: 'rejected',
        message: rpcRes.message || 'Rule rejected successfully.',
      });
    }

    // ACTION: APPROVE (Atomic RPC)
    if (action === 'approve') {
      const { data: rpcRes, error: rpcErr } = await adminDb.rpc('approve_staged_knowledge_atomic', {
        p_staging_id: id,
        p_account_id: profile.account_id,
        p_user_id: user.id,
        p_confirmed_by_phone: user.email || 'web_dashboard',
        p_override_entity: extractedEntity || null,
        p_override_attribute: extractedAttribute || null,
        p_override_value: extractedValue || null,
      });

      if (rpcErr) {
        console.error('[Staging API] approve RPC error:', rpcErr);
        return NextResponse.json({ success: false, error: 'Database error processing approval' }, { status: 500 });
      }

      if (!rpcRes?.success) {
        const status = rpcRes?.error_code === 'NOT_FOUND' ? 404 : rpcRes?.error_code === 'ALREADY_PROCESSED' ? 409 : 400;
        return NextResponse.json({ success: false, error: rpcRes?.error || 'Failed to approve rule' }, { status });
      }

      return NextResponse.json({
        success: true,
        status: 'confirmed',
        documentId: rpcRes.document_id,
        message: rpcRes.message || 'Rule approved and activated in live AI sales knowledge base.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Staging API] PATCH unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
