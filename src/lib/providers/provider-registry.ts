import { MessagingProvider, ProviderId } from './types';
import { MetaCloudProvider, MetaCloudConfig } from './meta-cloud-provider';
import { BaileysQrProvider, BaileysConfig } from './baileys-qr-provider';

export interface ProviderResolutionOptions {
  preferredProvider?: ProviderId;
  requireGroupCapabilities?: boolean;
}

export class ProviderRegistry {
  private static metaProvider: MetaCloudProvider | null = null;
  private static baileysProvider: BaileysQrProvider | null = null;

  static initializeMeta(config: MetaCloudConfig) {
    this.metaProvider = new MetaCloudProvider(config);
  }

  static initializeBaileys(config: BaileysConfig) {
    this.baileysProvider = new BaileysQrProvider(config);
  }

  /**
   * Resolves the optimal provider for the given operational requirement.
   * If group capabilities are required, automatically routes to Baileys QR.
   * Otherwise, defaults to Official Meta Cloud API for 100% production safety.
   */
  static getProvider(options: ProviderResolutionOptions = {}): MessagingProvider {
    if (options.requireGroupCapabilities) {
      if (!this.baileysProvider) {
        // Fallback to default VPS bridge configuration if not explicitly initialized
        this.baileysProvider = new BaileysQrProvider({
          bridgeUrl: process.env.WHATSAPP_BAILEYS_URL || 'http://72.61.232.114:3001',
        });
      }
      return this.baileysProvider;
    }

    if (options.preferredProvider === 'baileys_qr' && this.baileysProvider) {
      return this.baileysProvider;
    }

    // Default to Meta Cloud Provider
    if (!this.metaProvider) {
      this.metaProvider = new MetaCloudProvider({
        phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
        accessToken: process.env.META_ACCESS_TOKEN || '',
        wabaId: process.env.META_WABA_ID || '',
      });
    }

    return this.metaProvider;
  }
}
