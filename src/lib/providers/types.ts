/**
 * Vismart Messaging Provider Abstraction Layer
 *
 * Decouples WhatsApp connectivity from CRM, AI Agents, and Business Logic.
 * Allows seamless coexistence of:
 * 1. Official Meta WhatsApp Cloud API (Production Standard - 0% Ban Risk)
 * 2. QR-based Baileys / Evolution Bridge (Community & Group Intel)
 */

export type ProviderId = 'meta_cloud_api' | 'baileys_qr' | 'evolution_api';

export interface ProviderCapabilities {
  /** Can send 1-on-1 direct messages to phone numbers */
  individualMessaging: boolean;
  /** Receives real-time delivery status & incoming webhooks */
  incomingWebhooks: boolean;
  /** Supports image, video, document, audio */
  mediaMessaging: boolean;
  /** Supports Meta interactive buttons / Quick Replies */
  interactiveButtons: boolean;
  /** Supports list messages */
  interactiveLists: boolean;
  /** Strict Meta approved templates required for outreach (>24h window) */
  templateRequired: boolean;
  /** Can inspect participating WhatsApp groups and member counts */
  groupRead: boolean;
  /** Can send message to a WhatsApp group JID */
  groupSend: boolean;
  /** Can manage participants (Add/Remove) */
  groupMemberManagement: boolean;
  /** Official WhatsApp Channels support */
  channelRead: boolean;
  channelPublish: boolean;
  /** Calculated account restriction risk */
  banRisk: 'zero' | 'low' | 'medium' | 'high';
  /** Human readable status string for UI */
  statusLabel: string;
}

export interface ConnectionStatus {
  connected: boolean;
  provider: ProviderId;
  identity: string | null; // e.g. Phone number ID or logged in JID
  phoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  lastChecked: string;
  error?: string;
}

export interface SendMessageInput {
  recipient: string; // Phone number with country code (e.g. 919826012345) or group JID
  type: 'text' | 'template' | 'interactive' | 'image' | 'video' | 'document' | 'audio';
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateParams?: Record<string, string>;
  mediaUrl?: string;
  caption?: string;
  interactivePayload?: any;
  /** Anti-ban random delay in milliseconds (used for QR provider queues) */
  delayMs?: number;
}

export interface SendResult {
  success: boolean;
  messageId: string;
  recipient: string;
  provider: ProviderId;
  timestamp: string;
  rawResponse?: unknown;
}

export interface NormalizedMessageEvent {
  messageId: string;
  senderPhone: string;
  senderName?: string;
  recipientId: string;
  timestamp: string;
  isGroup: boolean;
  groupId?: string;
  type: 'text' | 'image' | 'interactive_response' | 'template_reply' | 'unknown';
  text?: string;
  mediaUrl?: string;
  rawPayload: unknown;
}

export interface MessagingProvider {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;

  /** Check real-time connection health */
  getStatus(): Promise<ConnectionStatus>;

  /** Send outbound message adhering to provider capabilities */
  sendMessage(input: SendMessageInput): Promise<SendResult>;

  /** Fetch participating groups (if supported by provider capabilities) */
  getGroups?(): Promise<Array<{ id: string; subject: string; participantsCount: number; desc?: string }>>;

  /** Normalize webhook payload into unified event */
  normalizeIncomingEvent(rawPayload: unknown): NormalizedMessageEvent | null;
}
