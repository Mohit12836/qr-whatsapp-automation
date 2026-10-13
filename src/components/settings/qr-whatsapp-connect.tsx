'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, CheckCircle2, Smartphone, ShieldCheck, Zap, Bot } from 'lucide-react';
import QRCode from 'qrcode';

const TUNNEL_URL = 'https://strictly-garcia-impacts-distributor.trycloudflare.com';

export function QrWhatsAppConnect() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'scan_needed' | 'open' | 'offline'>('connecting');
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      let data = null;
      // Try Cloudflare Tunnel URL first (works on Vercel live production)
      try {
        const res = await fetch(`${TUNNEL_URL}/status`, { cache: 'no-store' });
        if (res.ok) data = await res.json();
      } catch {
        // Fallback to localhost
        try {
          const res2 = await fetch('http://localhost:4100/status', { cache: 'no-store' });
          if (res2.ok) data = await res2.json();
        } catch {
          data = null;
        }
      }

      if (!data) {
        setStatus('connecting');
        return;
      }

      if (data.status === 'open') {
        setStatus('open');
        setConnectedPhone(data.phone || 'Linked');
        setQrDataUrl(null);
      } else if (data.status === 'scan_needed' && data.qr) {
        setStatus('scan_needed');
        const url = await QRCode.toDataURL(data.qr, {
          width: 280,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      }
    } catch (err) {
      console.error('Error fetching QR status:', err);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    pollTimerRef.current = setInterval(() => {
      void fetchStatus();
    }, 3000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchStatus]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchStatus();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Real WhatsApp Web QR Agent</CardTitle>
              <CardDescription>
                Scan with your phone to connect your number with zero Meta charges. Powered by Baileys Multi-Device Engine.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: QR Display Box */}
            <div className="flex flex-col items-center justify-center p-6 border rounded-xl bg-muted/20">
              {status === 'open' ? (
                <div className="flex flex-col items-center text-center p-8 space-y-3">
                  <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-500">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">WhatsApp Linked Successfully!</h3>
                  <p className="text-sm text-emerald-600 font-medium">
                    Connected Number: +{connectedPhone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Google Gemini 2.5 Flash AI is automatically responding to all incoming messages.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-xl shadow-sm border">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="WhatsApp Web QR Code" className="w-64 h-64 rounded-lg" />
                    ) : (
                      <div className="w-64 h-64 flex flex-col items-center justify-center bg-muted/40 rounded-lg space-y-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">Loading live WhatsApp QR...</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh QR Code
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Step-by-Step Instructions */}
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                How to link your WhatsApp:
              </h4>

              <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                <li className="leading-relaxed">
                  Open <strong>WhatsApp</strong> on your mobile phone.
                </li>
                <li className="leading-relaxed">
                  Tap <strong>Settings</strong> (iPhone) or <strong>Three Dots ⋮</strong> (Android) and choose <strong>Linked Devices</strong>.
                </li>
                <li className="leading-relaxed">
                  Tap <strong>Link a Device</strong> and point your camera at this QR code.
                </li>
              </ol>

              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>100% Free: No Meta API bills, no credit cards required.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bot className="h-4 w-4 text-primary shrink-0" />
                  <span>Gemini 2.5 Flash AI automatically handles Solar energy sales.</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Real WhatsApp Web session running on your local machine.</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
