import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './admin-client';
import {
  getFailClosedDefaultPolicy,
  roundToTwoDecimals,
  type TenantBusinessPolicy,
} from './policy-guard';

/**
 * Explicit supported ISO 4217 currency allowlist.
 */
export const SUPPORTED_CURRENCIES = [
  'INR', // Indian Rupee
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'AED', // UAE Dirham
  'SAR', // Saudi Riyal
  'SGD', // Singapore Dollar
  'CAD', // Canadian Dollar
  'AUD', // Australian Dollar
  'BRL', // Brazilian Real
  'MXN', // Mexican Peso
  'JPY', // Japanese Yen
  'MYR', // Malaysian Ringgit
  'IDR', // Indonesian Rupiah
  'THB', // Thai Baht
  'PHP', // Philippine Peso
  'ZAR', // South African Rand
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export function isSupportedCurrency(curr: string): curr is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(curr.toUpperCase());
}

export interface PolicyUpsertPayload {
  currency?: string;
  maxDiscountPercentage?: number;
  minOrderAmount?: number;
  maxAutonomousPaymentAmount?: number;
  allowAutonomousDiscounts?: boolean;
  allowAutonomousPaymentLinks?: boolean;
  allowAutonomousBooking?: boolean;
  requireHumanApprovalForRefunds?: boolean;
  requireHumanApprovalForCancellations?: boolean;
  requireHumanApprovalForDataDeletion?: boolean;
  confirmedByPhone?: string;
}

export type LoadPolicyResult =
  | { success: true; policy: TenantBusinessPolicy; isDefault: boolean }
  | { success: false; error: string; errorCode: 'DB_ERROR' | 'INVALID_ARGUMENT'; policy: null };

export interface PolicyServiceResponse {
  success: boolean;
  policy?: TenantBusinessPolicy;
  version?: number;
  auditId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Maps raw database row into typed TenantBusinessPolicy
 */
export function mapDbRowToPolicy(row: Record<string, unknown>, accountId: string): TenantBusinessPolicy {
  const rawCurrency = typeof row.currency === 'string' ? row.currency.toUpperCase() : 'INR';
  const currency = isSupportedCurrency(rawCurrency) ? rawCurrency : 'INR';

  return {
    accountId,
    currency,
    maxDiscountPercentage: Number(row.max_discount_percentage ?? 0.0),
    minOrderAmount: Number(row.min_order_amount ?? 1.0),
    maxAutonomousPaymentAmount: Number(row.max_autonomous_payment_amount ?? 0.0),
    allowAutonomousDiscounts: Boolean(row.allow_autonomous_discounts ?? false),
    allowAutonomousPaymentLinks: Boolean(row.allow_autonomous_payment_links ?? false),
    allowAutonomousBooking: Boolean(row.allow_autonomous_booking ?? false),
    requireHumanApprovalForRefunds: Boolean(row.require_human_approval_for_refunds ?? true),
    requireHumanApprovalForCancellations: Boolean(row.require_human_approval_for_cancellations ?? true),
    requireHumanApprovalForDataDeletion: Boolean(row.require_human_approval_for_data_deletion ?? true),
    version: Number(row.version ?? 1),
  };
}

/**
 * 1. Load the active business policy result for a tenant.
 * Clearly distinguishes between:
 *  - Missing row in DB (success: true, isDefault: true, fail-closed policy)
 *  - Database / Query failure (success: false, errorCode: 'DB_ERROR')
 */
export async function loadTenantPolicyResult(
  db: SupabaseClient,
  accountId: string
): Promise<LoadPolicyResult> {
  if (!accountId || typeof accountId !== 'string') {
    return {
      success: false,
      error: 'Valid Account ID is required',
      errorCode: 'INVALID_ARGUMENT',
      policy: null,
    };
  }

  const { data, error } = await db
    .from('ai_business_policies')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error) {
    console.error('[Policy Service] DB error loading policy:', error);
    return {
      success: false,
      error: 'Failed to load policy from database',
      errorCode: 'DB_ERROR',
      policy: null,
    };
  }

  if (!data) {
    return {
      success: true,
      policy: getFailClosedDefaultPolicy(accountId),
      isDefault: true,
    };
  }

  return {
    success: true,
    policy: mapDbRowToPolicy(data, accountId),
    isDefault: false,
  };
}

/**
 * Simple getter for runtime callers (throws if database is down).
 */
export async function loadTenantPolicy(
  db: SupabaseClient,
  accountId: string
): Promise<TenantBusinessPolicy> {
  const res = await loadTenantPolicyResult(db, accountId);
  if (!res.success) {
    throw new Error(`[Policy Service] ${res.error} (${res.errorCode})`);
  }
  return res.policy;
}

/**
 * 2. Save / Update business policy using atomic stored procedure with versioning and audit logging.
 */
export async function saveTenantPolicy(
  accountId: string,
  userId: string,
  payload: PolicyUpsertPayload
): Promise<PolicyServiceResponse> {
  if (!accountId || typeof accountId !== 'string') {
    return { success: false, error: 'Account ID is required', errorCode: 'INVALID_ARGUMENT' };
  }

  if (!userId || typeof userId !== 'string') {
    return { success: false, error: 'User ID is required', errorCode: 'INVALID_ARGUMENT' };
  }

  const rawCurrency = (payload.currency || 'INR').trim().toUpperCase();
  if (!isSupportedCurrency(rawCurrency)) {
    return {
      success: false,
      error: `Unsupported currency '${rawCurrency}'. Must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
      errorCode: 'INVALID_CURRENCY',
    };
  }

  const maxDiscount = roundToTwoDecimals(Number(payload.maxDiscountPercentage ?? 0.0));
  if (Number.isNaN(maxDiscount) || maxDiscount < 0.0 || maxDiscount > 100.0) {
    return { success: false, error: 'Maximum discount must be a number between 0 and 100%', errorCode: 'INVALID_DISCOUNT' };
  }

  const minOrder = roundToTwoDecimals(Number(payload.minOrderAmount ?? 1.0));
  if (Number.isNaN(minOrder) || minOrder < 0.0) {
    return { success: false, error: 'Minimum order amount cannot be negative', errorCode: 'INVALID_MIN_ORDER' };
  }

  const maxPayment = roundToTwoDecimals(Number(payload.maxAutonomousPaymentAmount ?? 0.0));
  if (Number.isNaN(maxPayment) || maxPayment < 0.0) {
    return { success: false, error: 'Maximum autonomous payment amount cannot be negative', errorCode: 'INVALID_MAX_PAYMENT' };
  }

  const adminDb = supabaseAdmin();
  const { data: rpcRes, error: rpcErr } = await adminDb.rpc('upsert_ai_business_policy_atomic', {
    p_account_id: accountId,
    p_user_id: userId,
    p_currency: rawCurrency,
    p_max_discount: maxDiscount,
    p_min_order: minOrder,
    p_max_payment: maxPayment,
    p_allow_discounts: Boolean(payload.allowAutonomousDiscounts),
    p_allow_payments: Boolean(payload.allowAutonomousPaymentLinks),
    p_allow_booking: Boolean(payload.allowAutonomousBooking),
    p_require_refund_approval: payload.requireHumanApprovalForRefunds !== false,
    p_require_cancel_approval: payload.requireHumanApprovalForCancellations !== false,
    p_require_deletion_approval: payload.requireHumanApprovalForDataDeletion !== false,
    p_confirmed_by_phone: payload.confirmedByPhone || 'web_dashboard',
  });

  if (rpcErr || !rpcRes) {
    console.error('[Policy Service] RPC error:', rpcErr);
    return { success: false, error: 'Failed to persist business policy in database', errorCode: 'DB_ERROR' };
  }

  if (!rpcRes.success) {
    return {
      success: false,
      error: rpcRes.error || 'Policy persistence failed',
      errorCode: rpcRes.error_code || 'RPC_FAILURE',
    };
  }

  const updatedPolicy = mapDbRowToPolicy(rpcRes.policy, accountId);

  return {
    success: true,
    policy: updatedPolicy,
    version: rpcRes.version,
    auditId: rpcRes.audit_id,
  };
}
