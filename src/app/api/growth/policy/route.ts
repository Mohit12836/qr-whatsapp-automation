import { NextRequest, NextResponse } from 'next/server';
import { PolicyGuardEngine } from '@/lib/policy/policy-guard';

const policyGuard = new PolicyGuardEngine();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'approvals';

  if (type === 'approvals') {
    return NextResponse.json({
      success: true,
      data: policyGuard.getPendingApprovals(),
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      pendingCount: policyGuard.getPendingApprovals().length,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'freeze_all') {
      policyGuard.freezeAll(body.reason);
      return NextResponse.json({ success: true, message: 'All autonomous agent execution frozen globally.' });
    }

    if (action === 'unfreeze_all') {
      policyGuard.unfreezeAll();
      return NextResponse.json({ success: true, message: 'System unfrozen.' });
    }

    if (action === 'freeze_contact') {
      policyGuard.freezeContact(body.contactId);
      return NextResponse.json({ success: true, message: `Contact ${body.contactId} handed off to human agent.` });
    }

    if (action === 'unfreeze_contact') {
      policyGuard.unfreezeContact(body.contactId);
      return NextResponse.json({ success: true, message: `Contact ${body.contactId} released back to AI.` });
    }

    if (action === 'approve') {
      const res = policyGuard.approve(body.id, body.reviewerId || 'admin');
      return NextResponse.json(res);
    }

    if (action === 'reject') {
      const res = policyGuard.reject(body.id, body.reviewerId || 'admin', body.reason || 'Rejected by policy');
      return NextResponse.json(res);
    }

    if (action === 'modify_and_approve') {
      const res = policyGuard.modifyAndApprove(body.id, body.reviewerId || 'admin', body.modifiedPayload);
      return NextResponse.json(res);
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
