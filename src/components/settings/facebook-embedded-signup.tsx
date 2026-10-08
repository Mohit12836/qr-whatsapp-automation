'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
  }
}

interface FacebookEmbeddedSignupProps {
  onSuccess: (data: any) => void;
  isConfigured?: boolean;
}

export function FacebookEmbeddedSignup({
  onSuccess,
  isConfigured = false,
}: FacebookEmbeddedSignupProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [capturedData, setCapturedData] = useState<{
    waba_id?: string;
    phone_number_id?: string;
  }>({});

  const metaAppId =
    process.env.NEXT_PUBLIC_META_APP_ID || '1380482834156168';

  useEffect(() => {
    // Listen for Meta Embedded Signup message events
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const raw = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (raw?.type === 'WA_EMBEDDED_SIGNUP') {
          if (
            raw.event === 'FINISH' ||
            raw.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
          ) {
            setCapturedData({
              waba_id: raw?.data?.waba_id,
              phone_number_id: raw?.data?.phone_number_id,
            });
          }
        }
      } catch {
        // Non-JSON message from other extensions or frames
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const initFacebookSdk = () => {
    if (window.FB) {
      window.FB.init({
        appId: metaAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
      setSdkReady(true);
    }
  };

  const handleLaunchSignup = () => {
    if (!window.FB) {
      toast.error('Facebook SDK is still loading. Please wait 2 seconds.');
      return;
    }

    setConnecting(true);

    const handleResponse = (response: any) => {
      if (!response?.authResponse?.code) {
        setConnecting(false);
        if (response?.status === 'unknown') {
          toast.info('Popup closed or cancelled by user.');
        } else {
          toast.error('Facebook authorization was not completed.');
        }
        return;
      }

      const authCode = response.authResponse.code;
      toast.loading('Connecting WhatsApp account with Vismart CRM...', { id: 'embed-sync' });

      // Run async exchange in separate promise chain
      fetch('/api/whatsapp/embedded-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: authCode,
          waba_id: capturedData.waba_id,
          phone_number_id: capturedData.phone_number_id,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          toast.dismiss('embed-sync');
          if (!res.ok) {
            toast.error(data.error || 'Failed to finish WhatsApp Embedded Signup.');
            setConnecting(false);
            return;
          }
          toast.success(
            '🎉 WhatsApp Cloud API successfully connected via Facebook Embedded Signup!'
          );
          setConnecting(false);
          onSuccess(data);
        })
        .catch((err: any) => {
          toast.dismiss('embed-sync');
          setConnecting(false);
          toast.error(err.message || 'Network error during signup exchange.');
        });
    };

    try {
      window.FB.login(handleResponse, {
        response_type: 'code',
        override_default_response_type: true,
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        extras: {
          setup: {},
          featureType: 'whatsapp_business_app_onboarding',
          sessionInfoVersion: '3',
        },
      });
    } catch (err: any) {
      setConnecting(false);
      toast.error(err?.message || 'Failed to open Facebook login window');
    }
  };

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
        onLoad={initFacebookSdk}
      />

      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-md overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 text-primary" />
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-primary">
              Instant 1-Click Setup (Meta Official)
            </span>
          </div>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            Connect WhatsApp with Facebook
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            No copy-pasting tokens or webhooks! Simply log in with your Meta account and select your
            WhatsApp Business number. Everything configures automatically in 10 seconds.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              type="button"
              onClick={handleLaunchSignup}
              disabled={connecting}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium px-6 py-5 shadow-sm transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99]"
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting to Meta...
                </>
              ) : (
                <>
                  <svg
                    className="mr-2.5 h-5 w-5 fill-current"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Connect WhatsApp with Facebook
                </>
              )}
            </Button>

            {isConfigured && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>WhatsApp Cloud API is actively connected</span>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Supports official Meta Cloud API, co-existence with existing WhatsApp Business App, and
            auto-verified webhook subscriptions.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
