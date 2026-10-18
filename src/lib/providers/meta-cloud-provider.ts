import {
  MessagingProvider,
  ProviderId,
  ProviderCapabilities,
  ConnectionStatus,
  SendMessageInput,
  SendResult,
  NormalizedMessageEvent,
} from './types';
import {
  sendTextMessage,
  sendTemplateMessage,
  sendMediaMessage,
} from '@/lib/whatsapp/meta-api';

export interface MetaCloudConfig {
  phoneNumberId: string;
  accessToken: string;
  wabaId?: string;
}

export class MetaCloudProvider implements MessagingProvider {
  readonly id: ProviderId = 'meta_cloud_api';
  readonly capabilities: ProviderCapabilities = {
    individualMessaging: true,
    incomingWebhooks: true,
    mediaMessaging: true,
    interactiveButtons: true,
    interactiveLists: true,
    templateRequired: true, // Strict Meta 24h conversation window
    groupRead: false,       // Meta Cloud API does not expose regular consumer groups
    groupSend: false,
    groupMemberManagement: false,
    channelRead: false,
    channelPublish: false,
    banRisk: 'zero',        // 100% Official Meta Partner Protocol
    statusLabel: 'Official Meta WhatsApp Cloud API (Production Verified)',
  };

  private config: MetaCloudConfig;

  constructor(config: MetaCloudConfig) {
    this.config = config;
  }

  async getStatus(): Promise<ConnectionStatus> {
    try {
      const url = `https://graph.facebook.com/v21.0/${this.config.phoneNumberId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.config.accessToken}` },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`Meta Graph API returned HTTP ${res.status}`);
      }

      const phoneInfo = await res.json();

      return {
        connected: true,
        provider: this.id,
        identity: phoneInfo.id || this.config.phoneNumberId,
        phoneNumber: phoneInfo.display_phone_number,
        verifiedName: phoneInfo.verified_name,
        qualityRating: phoneInfo.quality_rating,
        lastChecked: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: this.id,
        identity: this.config.phoneNumberId,
        lastChecked: new Date().toISOString(),
        error: err.message || 'Failed to authenticate with Meta Graph API',
      };
    }
  }

  async sendMessage(input: SendMessageInput): Promise<SendResult> {
    const { recipient, type, text, templateName, templateLanguage = 'en_US', templateParams, mediaUrl, caption } = input;

    if (type === 'template' && templateName) {
      const res = await sendTemplateMessage({
        phoneNumberId: this.config.phoneNumberId,
        accessToken: this.config.accessToken,
        to: recipient,
        templateName,
        language: templateLanguage,
        params: templateParams ? Object.values(templateParams) : undefined,
      });

      return {
        success: true,
        messageId: res.messageId,
        recipient,
        provider: this.id,
        timestamp: new Date().toISOString(),
        rawResponse: res,
      };
    }

    if (type === 'text' && text) {
      const res = await sendTextMessage({
        phoneNumberId: this.config.phoneNumberId,
        accessToken: this.config.accessToken,
        to: recipient,
        text,
      });

      return {
        success: true,
        messageId: res.messageId,
        recipient,
        provider: this.id,
        timestamp: new Date().toISOString(),
        rawResponse: res,
      };
    }

    if ((type === 'image' || type === 'video' || type === 'document') && mediaUrl) {
      const res = await sendMediaMessage({
        phoneNumberId: this.config.phoneNumberId,
        accessToken: this.config.accessToken,
        to: recipient,
        kind: type,
        link: mediaUrl,
        caption,
      });

      return {
        success: true,
        messageId: res.messageId,
        recipient,
        provider: this.id,
        timestamp: new Date().toISOString(),
        rawResponse: res,
      };
    }

    throw new Error(`Unsupported message type [${type}] or missing parameters for Meta Cloud Provider.`);
  }

  normalizeIncomingEvent(rawPayload: any): NormalizedMessageEvent | null {
    try {
      const entry = rawPayload?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      const contact = change?.contacts?.[0];

      if (!message) return null;

      return {
        messageId: message.id,
        senderPhone: message.from,
        senderName: contact?.profile?.name,
        recipientId: change?.metadata?.phone_number_id,
        timestamp: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString(),
        isGroup: false,
        type: message.type === 'text' ? 'text' : message.type === 'image' ? 'image' : 'unknown',
        text: message.text?.body,
        rawPayload,
      };
    } catch {
      return null;
    }
  }
}
