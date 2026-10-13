-- ============================================================
-- 047_ai_business_policies.sql
--
-- Tenant-Scoped AI Business Policies & Safety Guardrails
--
-- Safe Defaults:
--   - Autonomous discounts: DISABLED (allow_autonomous_discounts = false, max_discount = 0.00%)
--   - Autonomous payments: DISABLED (allow_autonomous_payment_links = false, max_payment = 0.00)
--   - Autonomous booking: DISABLED (allow_autonomous_booking = false)
--   - Sensitive operations require human approval: TRUE (refunds, cancellations, data deletion)
--   - Currency: 'INR' (strictly validated against ISO 4217 supported currency registry)
--
-- Functions:
--   1. public.upsert_ai_business_policy_atomic(...) -> JSONB
--
-- Guarantees:
--   1. Fully qualified object references (public.ai_business_policies, public.audit_confirmation_logs).
--   2. Atomic version increment and audit confirmation logging in a single transaction.
--   3. Audit failure or constraint violation guarantees full rollback.
--   4. Strict Row-Level Security (RLS) and execution restricted to service_role with safe search_path.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_business_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'SGD', 'CAD', 'AUD', 'BRL', 'MXN', 'JPY', 'MYR', 'IDR', 'THB', 'PHP', 'ZAR')),
  max_discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (max_discount_percentage >= 0.00 AND max_discount_percentage <= 100.00),
  min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 1.00 CHECK (min_order_amount >= 0.00),
  max_autonomous_payment_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (max_autonomous_payment_amount >= 0.00),
  allow_autonomous_discounts BOOLEAN NOT NULL DEFAULT FALSE,
  allow_autonomous_payment_links BOOLEAN NOT NULL DEFAULT FALSE,
  allow_autonomous_booking BOOLEAN NOT NULL DEFAULT FALSE,
  require_human_approval_for_refunds BOOLEAN NOT NULL DEFAULT TRUE,
  require_human_approval_for_cancellations BOOLEAN NOT NULL DEFAULT TRUE,
  require_human_approval_for_data_deletion BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_account_ai_business_policy UNIQUE (account_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_business_policies_account_id
  ON public.ai_business_policies(account_id);

-- Enable RLS
ALTER TABLE public.ai_business_policies ENABLE ROW LEVEL SECURITY;

-- Read policy: Any account member (viewer+) can read
DROP POLICY IF EXISTS "ai_business_policies_select_member" ON public.ai_business_policies;
CREATE POLICY "ai_business_policies_select_member" ON public.ai_business_policies
  FOR SELECT TO authenticated
  USING (public.is_account_member(account_id, 'viewer'));

-- Write policy: Only admin+ can modify directly
DROP POLICY IF EXISTS "ai_business_policies_admin_manage" ON public.ai_business_policies;
CREATE POLICY "ai_business_policies_admin_manage" ON public.ai_business_policies
  FOR ALL TO authenticated
  USING (public.is_account_member(account_id, 'admin'))
  WITH CHECK (public.is_account_member(account_id, 'admin'));

-- Stored Procedure for atomic upsert with audit trail and versioning
CREATE OR REPLACE FUNCTION public.upsert_ai_business_policy_atomic(
  p_account_id UUID,
  p_user_id UUID,
  p_currency TEXT DEFAULT 'INR',
  p_max_discount NUMERIC DEFAULT 0.00,
  p_min_order NUMERIC DEFAULT 1.00,
  p_max_payment NUMERIC DEFAULT 0.00,
  p_allow_discounts BOOLEAN DEFAULT FALSE,
  p_allow_payments BOOLEAN DEFAULT FALSE,
  p_allow_booking BOOLEAN DEFAULT FALSE,
  p_require_refund_approval BOOLEAN DEFAULT TRUE,
  p_require_cancel_approval BOOLEAN DEFAULT TRUE,
  p_require_deletion_approval BOOLEAN DEFAULT TRUE,
  p_confirmed_by_phone TEXT DEFAULT 'web_dashboard'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing RECORD;
  v_new_version INTEGER := 1;
  v_policy RECORD;
  v_clean_currency TEXT;
  v_audit_id UUID;
BEGIN
  -- 1. Input Validation
  IF p_account_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_ARGUMENT', 'error', 'Account ID is required');
  END IF;

  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_ARGUMENT', 'error', 'User ID is required');
  END IF;

  v_clean_currency := UPPER(TRIM(COALESCE(p_currency, 'INR')));
  IF v_clean_currency NOT IN ('INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'SGD', 'CAD', 'AUD', 'BRL', 'MXN', 'JPY', 'MYR', 'IDR', 'THB', 'PHP', 'ZAR') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_CURRENCY', 'error', 'Unsupported currency: must be a supported ISO 4217 code');
  END IF;

  IF p_max_discount < 0.00 OR p_max_discount > 100.00 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_DISCOUNT', 'error', 'Max discount must be between 0 and 100%');
  END IF;

  IF p_min_order < 0.00 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_MIN_ORDER', 'error', 'Minimum order amount cannot be negative');
  END IF;

  IF p_max_payment < 0.00 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_MAX_PAYMENT', 'error', 'Max payment amount cannot be negative');
  END IF;

  -- 2. Lock and fetch existing policy for this account (Pessimistic concurrency lock)
  SELECT * INTO v_existing
  FROM public.ai_business_policies
  WHERE account_id = p_account_id
  FOR UPDATE;

  IF FOUND THEN
    v_new_version := v_existing.version + 1;
    
    UPDATE public.ai_business_policies
    SET currency = v_clean_currency,
        max_discount_percentage = p_max_discount,
        min_order_amount = p_min_order,
        max_autonomous_payment_amount = p_max_payment,
        allow_autonomous_discounts = p_allow_discounts,
        allow_autonomous_payment_links = p_allow_payments,
        allow_autonomous_booking = p_allow_booking,
        require_human_approval_for_refunds = p_require_refund_approval,
        require_human_approval_for_cancellations = p_require_cancel_approval,
        require_human_approval_for_data_deletion = p_require_deletion_approval,
        version = v_new_version,
        updated_at = NOW()
    WHERE account_id = p_account_id
    RETURNING * INTO v_policy;
  ELSE
    INSERT INTO public.ai_business_policies (
      account_id,
      currency,
      max_discount_percentage,
      min_order_amount,
      max_autonomous_payment_amount,
      allow_autonomous_discounts,
      allow_autonomous_payment_links,
      allow_autonomous_booking,
      require_human_approval_for_refunds,
      require_human_approval_for_cancellations,
      require_human_approval_for_data_deletion,
      version,
      created_at,
      updated_at
    ) VALUES (
      p_account_id,
      v_clean_currency,
      p_max_discount,
      p_min_order,
      p_max_payment,
      p_allow_discounts,
      p_allow_payments,
      p_allow_booking,
      p_require_refund_approval,
      p_require_cancel_approval,
      p_require_deletion_approval,
      1,
      NOW(),
      NOW()
    )
    RETURNING * INTO v_policy;
  END IF;

  IF v_policy.id IS NULL THEN
    RAISE EXCEPTION 'Failed to persist business policy';
  END IF;

  -- 3. Write immutable audit log entry (atomic within same transaction)
  INSERT INTO public.audit_confirmation_logs (
    account_id,
    action_type,
    risk_level,
    confirmation_steps,
    confirmed_by_phone,
    details,
    created_at
  ) VALUES (
    p_account_id,
    'policy_updated',
    'level_1',
    1,
    COALESCE(p_confirmed_by_phone, 'web_dashboard'),
    jsonb_build_object(
      'policy_id', v_policy.id,
      'version', v_policy.version,
      'currency', v_policy.currency,
      'max_discount_percentage', v_policy.max_discount_percentage,
      'allow_autonomous_discounts', v_policy.allow_autonomous_discounts,
      'allow_autonomous_payment_links', v_policy.allow_autonomous_payment_links,
      'updated_by_user_id', p_user_id
    ),
    NOW()
  )
  RETURNING id INTO v_audit_id;

  IF v_audit_id IS NULL THEN
    RAISE EXCEPTION 'Failed to write audit confirmation log for policy update';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'policy', row_to_json(v_policy),
    'version', v_policy.version,
    'audit_id', v_audit_id,
    'message', 'AI business policy saved successfully.'
  );
END;
$$;

-- Revoke permissions from public/anon/authenticated
REVOKE ALL ON FUNCTION public.upsert_ai_business_policy_atomic(UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;

-- Grant execution strictly to service_role
GRANT EXECUTE ON FUNCTION public.upsert_ai_business_policy_atomic(UUID, UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO service_role;
