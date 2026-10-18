import { NextResponse } from 'next/server';
import { ProviderRegistry } from '@/lib/providers/provider-registry';

export async function GET() {
  try {
    const metaProvider = ProviderRegistry.getProvider();
    const baileysProvider = ProviderRegistry.getProvider({ requireGroupCapabilities: true });

    const [metaStatus, baileysStatus] = await Promise.allSettled([
      metaProvider.getStatus(),
      baileysProvider.getStatus(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: {
        meta_cloud_api: {
          capabilities: metaProvider.capabilities,
          status: metaStatus.status === 'fulfilled' ? metaStatus.value : { connected: false, error: 'Failed' },
        },
        baileys_qr: {
          capabilities: baileysProvider.capabilities,
          status: baileysStatus.status === 'fulfilled' ? baileysStatus.value : { connected: false, error: 'Failed' },
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to inspect providers' },
      { status: 500 }
    );
  }
}
