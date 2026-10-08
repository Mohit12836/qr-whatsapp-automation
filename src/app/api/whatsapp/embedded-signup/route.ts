import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { encrypt } from '@/lib/whatsapp/encryption';
import {
  subscribeWabaToApp,
  registerPhoneNumber,
  verifyPhoneNumber,
} from '@/lib/whatsapp/meta-api';

function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/whatsapp/embedded-signup
 *
 * Handles the Facebook Login Coexistence / Embedded Signup callback.
 * 1. Takes the temporary auth code from FB.login.
 * 2. Exchanges it with Meta Graph API for a long-lived Access Token.
 * 3. Pairs the WABA and phone_number_id.
 * 4. Subscribes the WABA to our webhook app.
 * 5. Registers the phone number with Cloud API (if needed).
 * 6. Stores the encrypted credentials in `whatsapp_config` under the caller's account_id.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'No account associated with user' }, { status: 400 });
    }

    if (profile.account_role !== 'owner' && profile.account_role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can configure WhatsApp' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, waba_id, phone_number_id } = body;

    if (!code) {
      return NextResponse.json({ error: 'Missing temporary authorization code' }, { status: 400 });
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Server misconfiguration: META_APP_ID or META_APP_SECRET missing' },
        { status: 500 }
      );
    }

    // Step 1: Exchange code for Access Token
    // https://graph.facebook.com/v21.0/oauth/access_token
    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: 'GET' });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Embedded Signup] Token exchange failed:', tokenData);
      return NextResponse.json(
        {
          error:
            tokenData?.error?.message || 'Failed to exchange authorization code for access token',
          meta: tokenData?.error,
        },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token as string;

    // Resolve target WABA and Phone Number ID
    let finalWabaId = waba_id;
    let finalPhoneNumberId = phone_number_id;

    // If phone_number_id or waba_id wasn't passed by the client event listener,
    // query Meta using debug_token or shared_waba
    if (!finalWabaId || !finalPhoneNumberId) {
      try {
        const debugRes = await fetch(
          `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(
            accessToken
          )}&access_token=${encodeURIComponent(accessToken)}`
        );
        const debugData = await debugRes.json();
        const granularScopes = debugData?.data?.granular_scopes || [];
        const wabaScope = granularScopes.find(
          (s: { scope: string; target_ids?: string[] }) =>
            s.scope === 'whatsapp_business_management'
        );
        if (wabaScope?.target_ids?.length && !finalWabaId) {
          finalWabaId = wabaScope.target_ids[0];
        }
      } catch (err) {
        console.warn('[Embedded Signup] debug_token lookup failed:', err);
      }
    }

    if (finalWabaId && !finalPhoneNumberId) {
      try {
        const phonesRes = await fetch(
          `https://graph.facebook.com/v21.0/${finalWabaId}/phone_numbers?access_token=${encodeURIComponent(
            accessToken
          )}`
        );
        const phonesData = await phonesRes.json();
        if (phonesData?.data?.length > 0) {
          finalPhoneNumberId = phonesData.data[0].id;
        }
      } catch (err) {
        console.warn('[Embedded Signup] phone_numbers lookup failed:', err);
      }
    }

    if (!finalPhoneNumberId || !finalWabaId) {
      return NextResponse.json(
        {
          error:
            'Could not detect Phone Number ID or WABA ID from Facebook. Please select a valid WhatsApp Business Account in the popup.',
        },
        { status: 400 }
      );
    }

    // Step 2: Subscribe WABA to Webhook
    try {
      await subscribeWabaToApp({
        wabaId: finalWabaId,
        accessToken,
      });
    } catch (subErr) {
      console.warn('[Embedded Signup] Auto-subscribe WABA warning:', subErr);
      // Non-fatal, proceed with registration
    }

    // Step 3: Register phone number with Cloud API (Cloud API registration)
    let registrationError: string | null = null;
    let registeredAt: string | null = null;

    try {
      await registerPhoneNumber({
        phoneNumberId: finalPhoneNumberId,
        accessToken,
        pin: '000000', // standard registration pin
      });
      registeredAt = new Date().toISOString();
    } catch (regErr: any) {
      console.warn('[Embedded Signup] Phone registration note:', regErr);
      registrationError = regErr?.message || 'Registration pending manual PIN or verification';
      // If already registered, still record
      registeredAt = new Date().toISOString();
    }

    // Step 4: Verify phone metadata
    let phoneInfo: any = null;
    try {
      phoneInfo = await verifyPhoneNumber({
        phoneNumberId: finalPhoneNumberId,
        accessToken,
      });
    } catch (err) {
      console.warn('[Embedded Signup] Verification info lookup note:', err);
    }

    // Step 5: Save encrypted credentials into database
    const encryptedToken = encrypt(accessToken);
    const verifyToken = `wacrm_embed_${profile.account_id.slice(0, 12)}`;

    const admin = supabaseAdmin();
    const configPayload = {
      account_id: profile.account_id,
      user_id: user.id,
      phone_number_id: finalPhoneNumberId,
      waba_id: finalWabaId,
      access_token_encrypted: encryptedToken,
      verify_token: verifyToken,
      registered_at: registeredAt,
      last_registration_error: registrationError,
      last_tested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await admin
      .from('whatsapp_config')
      .upsert(configPayload, { onConflict: 'account_id' });

    if (upsertErr) {
      console.error('[Embedded Signup] DB save failed:', upsertErr);
      return NextResponse.json({ error: 'Failed to save configuration to database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp Cloud API successfully connected via Facebook Embedded Signup!',
      phone_number_id: finalPhoneNumberId,
      waba_id: finalWabaId,
      display_phone_number: phoneInfo?.display_phone_number,
      verified_name: phoneInfo?.verified_name,
    });
  } catch (err: any) {
    console.error('[Embedded Signup] Unhandled error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error during Embedded Signup' },
      { status: 500 }
    );
  }
}
