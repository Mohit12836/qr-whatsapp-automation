import {
  MessagingProvider,
  ProviderId,
  ProviderCapabilities,
  ConnectionStatus,
  SendMessageInput,
  SendResult,
  NormalizedMessageEvent,
} from './types';

export interface BaileysConfig {
  bridgeUrl: string; // e.g. "http://72.61.232.114:3001" or "http://127.0.0.1:3001"
  sessionId?: string;
}

export class BaileysQrProvider implements MessagingProvider {
  readonly id: ProviderId = 'baileys_qr';
  readonly capabilities: ProviderCapabilities = {
    individualMessaging: true,
    incomingWebhooks: true,
    mediaMessaging: true,
    interactiveButtons: false, // Emulated in newer Baileys but unstable
    interactiveLists: false,
    templateRequired: false,   // Can send direct free-form messages
    groupRead: true,           // Fully supported via groupFetchAllParticipating()
    groupSend: true,           // Fully supported via group JID
    groupMemberManagement: true,
    channelRead: true,
    channelPublish: true,
    banRisk: 'medium',         // Risk exists for bulk cold messaging
    statusLabel: 'QR Baileys Bridge (Community, Group & Channel Automation)',
  };

  private config: BaileysConfig;

  constructor(config: BaileysConfig) {
    this.config = config;
  }

  async getStatus(): Promise<ConnectionStatus> {
    try {
      const res = await fetch(`${this.config.bridgeUrl}/status`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`Bridge returned HTTP ${res.status}`);
      }

      const data = await res.json();
      return {
        connected: Boolean(data.connected),
        provider: this.id,
        identity: data.user || null,
        phoneNumber: data.user ? data.user.split('@')[0].split(':')[0] : undefined,
        lastChecked: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: this.id,
        identity: null,
        lastChecked: new Date().toISOString(),
        error: err.message || 'Failed to reach Baileys Bridge',
      };
    }
  }

  async sendMessage(input: SendMessageInput): Promise<SendResult> {
    const { recipient, type, text, mediaUrl, caption } = input;
    const isGroup = recipient.endsWith('@g.us');

    if (isGroup) {
      const res = await fetch(`${this.config.bridgeUrl}/group/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: recipient,
          message: text || caption || '',
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown bridge failure' }));
        throw new Error(err.error || `HTTP ${res.status} from group/send`);
      }

      return {
        success: true,
        messageId: `baileys-grp-${Date.now()}`,
        recipient,
        provider: this.id,
        timestamp: new Date().toISOString(),
      };
    }

    // WhatsApp Channel / Newsletter message
    const isChannel = recipient.endsWith('@newsletter');
    if (isChannel) {
      const res = await fetch(`${this.config.bridgeUrl}/channel/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelJid: recipient,
          message: text || caption || '',
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown bridge failure' }));
        throw new Error(err.error || `HTTP ${res.status} from channel/send`);
      }

      return {
        success: true,
        messageId: `baileys-chn-${Date.now()}`,
        recipient,
        provider: this.id,
        timestamp: new Date().toISOString(),
      };
    }

    // Direct individual message
    const endpoint = mediaUrl ? `${this.config.bridgeUrl}/session/default/send-media` : `${this.config.bridgeUrl}/send`;
    const payload = mediaUrl
      ? { phone: recipient, mediaUrl, caption }
      : { phone: recipient, message: text };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown bridge failure' }));
      throw new Error(err.error || `HTTP ${res.status} from bridge send`);
    }

    return {
      success: true,
      messageId: `baileys-msg-${Date.now()}`,
      recipient,
      provider: this.id,
      timestamp: new Date().toISOString(),
    };
  }

  async resolveChannel(inviteLinkOrCode: string): Promise<{ channelJid: string; name: string; subscribersCount: number }> {
    const res = await fetch(`${this.config.bridgeUrl}/channel/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: inviteLinkOrCode, inviteCode: inviteLinkOrCode }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to resolve channel' }));
      throw new Error(err.error || `HTTP ${res.status} from channel/resolve`);
    }

    const data = await res.json();
    return {
      channelJid: data.metadata?.id,
      name: data.metadata?.thread_metadata?.name?.text || 'WhatsApp Channel',
      subscribersCount: parseInt(data.metadata?.thread_metadata?.subscribers_count || '0', 10),
    };
  }

  async getGroups(): Promise<Array<{ id: string; subject: string; participantsCount: number; desc?: string }>> {
    try {
      const res = await fetch(`${this.config.bridgeUrl}/groups`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} from /groups`);
      const data = await res.json();
      return data.groups || [];
    } catch (err: any) {
      console.error('[BaileysQrProvider] getGroups error:', err);
      return [];
    }
  }

  normalizeIncomingEvent(rawPayload: any): NormalizedMessageEvent | null {
    try {
      if (!rawPayload?.phone || !rawPayload?.message) return null;

      return {
        messageId: rawPayload.messageId || `baileys-in-${Date.now()}`,
        senderPhone: rawPayload.phone,
        senderName: rawPayload.senderName,
        recipientId: rawPayload.sessionId || 'default',
        timestamp: rawPayload.timestamp || new Date().toISOString(),
        isGroup: Boolean(rawPayload.groupId),
        groupId: rawPayload.groupId,
        type: rawPayload.mediaUrl ? 'image' : 'text',
        text: rawPayload.message,
        mediaUrl: rawPayload.mediaUrl,
        rawPayload,
      };
    } catch {
      return null;
    }
  }
}
