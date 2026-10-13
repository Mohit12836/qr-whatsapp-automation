-- ============================================================
-- 046_approve_staged_knowledge_atomic.sql
--
-- Transaction-Safe, Concurrency-Safe Staged Knowledge Approval & Rejection
--
-- Functions:
--   1. public.approve_staged_knowledge_atomic(
--        p_staging_id UUID,
--        p_account_id UUID,
--        p_user_id UUID,
--        p_confirmed_by_phone TEXT DEFAULT 'web_dashboard',
--        p_override_entity TEXT DEFAULT NULL,
--        p_override_attribute TEXT DEFAULT NULL,
--        p_override_value TEXT DEFAULT NULL
--      ) -> JSONB
--
--   2. public.reject_staged_knowledge_atomic(
--        p_staging_id UUID,
--        p_account_id UUID,
--        p_user_id UUID,
--        p_confirmed_by_phone TEXT DEFAULT 'web_dashboard'
--      ) -> JSONB
--
-- Guarantees:
--   1. Row-level locking (SELECT ... FOR UPDATE) to prevent concurrent race conditions.
--   2. Verifies account ownership and 'pending_confirmation' status.
--   3. Inserts document into ai_knowledge_documents and chunk into ai_knowledge_chunks.
--   4. Updates staging record to 'confirmed' / 'rejected'.
--   5. Logs to audit_confirmation_logs.
--   6. Transactional atomicity: entire operation rolls back on any failure.
--   7. Execution restricted strictly to service_role with SECURITY DEFINER.
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_staged_knowledge_atomic(
  p_staging_id UUID,
  p_account_id UUID,
  p_user_id UUID,
  p_confirmed_by_phone TEXT DEFAULT 'web_dashboard',
  p_override_entity TEXT DEFAULT NULL,
  p_override_attribute TEXT DEFAULT NULL,
  p_override_value TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_staged RECORD;
  v_doc_id UUID;
  v_chunk_id UUID;
  v_title TEXT;
  v_attr TEXT;
  v_val TEXT;
  v_content TEXT;
  v_chunk_content TEXT;
BEGIN
  -- 1. Input Validation
  IF p_staging_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_ARGUMENT', 'error', 'Staging ID is required');
  END IF;
  IF p_account_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_ARGUMENT', 'error', 'Account ID is required');
  END IF;

  -- 2. Concurrency Lock: Lock the staging record for update
  SELECT * INTO v_staged
  FROM temp_knowledge_staging
  WHERE id = p_staging_id
    AND account_id = p_account_id
  FOR UPDATE;

  -- 3. Verify Existence and Tenant Ownership
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'NOT_FOUND',
      'error', 'Staged rule not found in your workspace'
    );
  END IF;

  -- 4. Verify Pending Status (Prevent Duplicate Activations)
  IF v_staged.status <> 'pending_confirmation' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ALREADY_PROCESSED',
      'error', 'Rule is already in ''' || v_staged.status || ''' state'
    );
  END IF;

  -- 5. Prepare Title and Content (applying overrides if supplied)
  v_title := COALESCE(NULLIF(TRIM(p_override_entity), ''), v_staged.extracted_entity, 'Business Knowledge');
  v_attr := COALESCE(NULLIF(TRIM(p_override_attribute), ''), v_staged.extracted_attribute, 'Detail');
  v_val := COALESCE(NULLIF(TRIM(p_override_value), ''), v_staged.extracted_value, '');
  v_content := v_attr || ': ' || v_val;
  v_chunk_content := v_title || ': ' || v_content;

  -- 6. Insert Knowledge Document
  INSERT INTO ai_knowledge_documents (
    account_id,
    created_by,
    title,
    content,
    created_at,
    updated_at
  ) VALUES (
    p_account_id,
    p_user_id,
    v_title,
    v_content,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_doc_id;

  IF v_doc_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create knowledge document';
  END IF;

  -- 7. Insert Knowledge Chunk (required for RAG retrieval)
  INSERT INTO ai_knowledge_chunks (
    document_id,
    account_id,
    chunk_index,
    content,
    created_at
  ) VALUES (
    v_doc_id,
    p_account_id,
    0,
    v_chunk_content,
    NOW()
  )
  RETURNING id INTO v_chunk_id;

  IF v_chunk_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create knowledge chunk';
  END IF;

  -- 8. Mark Staging Record Confirmed
  UPDATE temp_knowledge_staging
  SET status = 'confirmed',
      confirmed_at = NOW(),
      extracted_entity = v_title,
      extracted_attribute = v_attr,
      extracted_value = v_val
  WHERE id = p_staging_id
    AND account_id = p_account_id;

  -- 9. Write Immutable Audit Confirmation Record
  INSERT INTO audit_confirmation_logs (
    account_id,
    action_type,
    risk_level,
    confirmation_steps,
    confirmed_by_phone,
    details,
    created_at
  ) VALUES (
    p_account_id,
    'knowledge_approved',
    'level_1',
    1,
    COALESCE(p_confirmed_by_phone, 'web_dashboard'),
    jsonb_build_object(
      'staging_id', p_staging_id,
      'document_id', v_doc_id,
      'chunk_id', v_chunk_id,
      'entity', v_title,
      'rule', v_content
    ),
    NOW()
  );

  -- 10. Return Success
  RETURN jsonb_build_object(
    'success', true,
    'status', 'confirmed',
    'document_id', v_doc_id,
    'message', 'Rule approved and activated in live AI sales knowledge base.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_staged_knowledge_atomic(
  p_staging_id UUID,
  p_account_id UUID,
  p_user_id UUID,
  p_confirmed_by_phone TEXT DEFAULT 'web_dashboard'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_staged RECORD;
BEGIN
  IF p_staging_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_ARGUMENT', 'error', 'Staging ID is required');
  END IF;
  IF p_account_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_ARGUMENT', 'error', 'Account ID is required');
  END IF;

  -- Lock staging record
  SELECT * INTO v_staged
  FROM temp_knowledge_staging
  WHERE id = p_staging_id
    AND account_id = p_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'NOT_FOUND',
      'error', 'Staged rule not found in your workspace'
    );
  END IF;

  IF v_staged.status <> 'pending_confirmation' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ALREADY_PROCESSED',
      'error', 'Rule is already in ''' || v_staged.status || ''' state'
    );
  END IF;

  -- Update staging record
  UPDATE temp_knowledge_staging
  SET status = 'rejected',
      confirmed_at = NOW()
  WHERE id = p_staging_id
    AND account_id = p_account_id;

  -- Write audit log
  INSERT INTO audit_confirmation_logs (
    account_id,
    action_type,
    risk_level,
    confirmation_steps,
    confirmed_by_phone,
    details,
    created_at
  ) VALUES (
    p_account_id,
    'knowledge_rejected',
    'level_1',
    1,
    COALESCE(p_confirmed_by_phone, 'web_dashboard'),
    jsonb_build_object(
      'staging_id', p_staging_id,
      'entity', v_staged.extracted_entity
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', 'rejected',
    'message', 'Rule rejected and excluded from AI knowledge base.'
  );
END;
$$;

-- Revoke execute from PUBLIC, anon, authenticated
REVOKE ALL ON FUNCTION public.approve_staged_knowledge_atomic(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_staged_knowledge_atomic(UUID, UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- Grant execute exclusively to service_role
GRANT EXECUTE ON FUNCTION public.approve_staged_knowledge_atomic(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_staged_knowledge_atomic(UUID, UUID, UUID, TEXT) TO service_role;
