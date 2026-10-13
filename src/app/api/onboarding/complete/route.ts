import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/ai/admin-client';

interface KnowledgeItem {
  title?: string;
  content?: string;
  q?: string;
  a?: string;
}

interface OnboardingRequestBody {
  businessName: string;
  industry?: string;
  city?: string;
  phone?: string;
  goals?: string[];
  knowledgeItems?: KnowledgeItem[];
  categoryDetails?: Record<string, unknown>;
  idempotencyKey?: string;
}

export async function POST(req: Request) {
  try {
    // 1. Verify Authenticated Session Server-Side
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign up or log in to launch your AI employee.',
          code: 'UNAUTHENTICATED',
        },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Payload
    let body: OnboardingRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload in request body' },
        { status: 400 }
      );
    }

    const {
      businessName,
      industry = 'general',
      city,
      phone,
      goals = [],
      knowledgeItems = [],
      categoryDetails = {},
      idempotencyKey,
    } = body;

    if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      );
    }

    if (businessName.trim().length > 120) {
      return NextResponse.json(
        { success: false, error: 'Business name cannot exceed 120 characters' },
        { status: 400 }
      );
    }

    // 3. Execute Atomic Database Provisioning
    const adminDb = supabaseAdmin();
    const { data: rpcResult, error: rpcError } = await adminDb.rpc('complete_onboarding_atomic', {
      p_user_id: user.id,
      p_business_name: businessName.trim(),
      p_industry: industry,
      p_city: city?.trim() || null,
      p_phone: phone?.trim() || null,
      p_goals: goals,
      p_knowledge_items: knowledgeItems,
      p_category_details: categoryDetails,
      p_idempotency_key: idempotencyKey || null,
    });

    if (rpcError) {
      console.error('[Onboarding API] complete_onboarding_atomic failed:', rpcError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to complete workspace onboarding. Please try again.',
          code: 'PROVISIONING_FAILED',
        },
        { status: 500 }
      );
    }

    // 4. Return Structured Success
    return NextResponse.json({
      success: true,
      accountId: rpcResult?.account_id,
      status: rpcResult?.status || 'active',
      trialEndsAt: rpcResult?.trial_ends_at,
      message: 'AI sales employee provisioned and active on your workspace.',
    });
  } catch (error) {
    console.error('[Onboarding API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected system error occurred during onboarding.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
