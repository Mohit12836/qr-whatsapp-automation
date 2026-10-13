import { NextResponse } from 'next/server';
import {
  getCurrentAccount,
  requireRole,
  toErrorResponse,
} from '@/lib/auth/account';
import {
  loadTenantPolicyResult,
  saveTenantPolicy,
  type PolicyUpsertPayload,
} from '@/lib/ai/policy-service';

/**
 * GET /api/ai/policies
 *
 * Any workspace member (viewer+) can read the active AI business policy.
 * Distinguishes between database errors and missing default policy rows.
 */
export async function GET() {
  try {
    const { supabase, accountId } = await getCurrentAccount();
    const result = await loadTenantPolicyResult(supabase, accountId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, errorCode: result.errorCode },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      policy: result.policy,
      isDefault: result.isDefault,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * POST /api/ai/policies  (admin+ / owner)
 *
 * Atomically upsert tenant AI business policy with audit logging and version tracking.
 */
export async function POST(request: Request) {
  try {
    const { accountId, userId } = await requireRole('admin');

    const body: PolicyUpsertPayload = await request.json().catch(() => ({}));
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const result = await saveTenantPolicy(accountId, userId, body);

    if (!result.success) {
      const status =
        result.errorCode === 'INVALID_CURRENCY' ||
        result.errorCode === 'INVALID_DISCOUNT' ||
        result.errorCode === 'INVALID_MIN_ORDER' ||
        result.errorCode === 'INVALID_MAX_PAYMENT' ||
        result.errorCode === 'INVALID_ARGUMENT'
          ? 400
          : 500;

      return NextResponse.json({ success: false, error: result.error, errorCode: result.errorCode }, { status });
    }

    return NextResponse.json({
      success: true,
      policy: result.policy,
      version: result.version,
      auditId: result.auditId,
      message: 'AI business policy saved successfully.',
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
