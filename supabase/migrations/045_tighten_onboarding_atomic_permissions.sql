-- ============================================================
-- 045_tighten_onboarding_atomic_permissions.sql
--
-- Security Hardening:
-- Revoke direct execution of complete_onboarding_atomic from
-- authenticated and public roles so clients cannot invoke it
-- directly with a spoofed p_user_id. Only service_role can call it.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.complete_onboarding_atomic(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT) FROM authenticated, public;
GRANT EXECUTE ON FUNCTION public.complete_onboarding_atomic(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT) TO service_role;
