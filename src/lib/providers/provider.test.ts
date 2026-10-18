import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderRegistry } from './provider-registry';
import { MetaCloudProvider } from './meta-cloud-provider';
import { BaileysQrProvider } from './baileys-qr-provider';

describe('Vismart Messaging Provider Adapter Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Capabilities Differentiation & Risk Classification', () => {
    it('MetaCloudProvider strictly enforces templateRequired and zero banRisk', () => {
      const provider = new MetaCloudProvider({
        phoneNumberId: 'test-phone-id',
        accessToken: 'test-token',
      });

      expect(provider.id).toBe('meta_cloud_api');
      expect(provider.capabilities.templateRequired).toBe(true);
      expect(provider.capabilities.groupRead).toBe(false);
      expect(provider.capabilities.groupSend).toBe(false);
      expect(provider.capabilities.banRisk).toBe('zero');
      expect(provider.capabilities.statusLabel).toContain('Production Verified');
    });

    it('BaileysQrProvider exposes group capabilities with medium banRisk', () => {
      const provider = new BaileysQrProvider({
        bridgeUrl: 'http://72.61.232.114:3001',
      });

      expect(provider.id).toBe('baileys_qr');
      expect(provider.capabilities.templateRequired).toBe(false);
      expect(provider.capabilities.groupRead).toBe(true);
      expect(provider.capabilities.groupSend).toBe(true);
      expect(provider.capabilities.banRisk).toBe('medium');
    });
  });

  describe('ProviderRegistry Routing Engine', () => {
    it('routes group operations to Baileys QR adapter automatically', () => {
      const provider = ProviderRegistry.getProvider({ requireGroupCapabilities: true });
      expect(provider.id).toBe('baileys_qr');
      expect(provider.capabilities.groupRead).toBe(true);
    });

    it('defaults standard 1-on-1 messaging to Meta Cloud Provider for safety', () => {
      const provider = ProviderRegistry.getProvider();
      expect(provider.id).toBe('meta_cloud_api');
      expect(provider.capabilities.banRisk).toBe('zero');
    });
  });

  describe('Normalized Event Parsing', () => {
    it('normalizes Meta webhook text payloads cleanly', () => {
      const provider = new MetaCloudProvider({
        phoneNumberId: 'test-phone',
        accessToken: 'test-token',
      });

      const rawMetaPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: 'meta-phone-123' },
                  contacts: [{ profile: { name: 'Rajesh Patidar' } }],
                  messages: [
                    {
                      id: 'wamid.HBgLM...',
                      from: '919826012345',
                      timestamp: '1729263600',
                      type: 'text',
                      text: { body: 'भैया जी रेट क्या है?' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const event = provider.normalizeIncomingEvent(rawMetaPayload);
      expect(event).not.toBeNull();
      expect(event?.senderPhone).toBe('919826012345');
      expect(event?.senderName).toBe('Rajesh Patidar');
      expect(event?.text).toBe('भैया जी रेट क्या है?');
      expect(event?.isGroup).toBe(false);
    });

    it('normalizes Baileys bridge incoming group events cleanly', () => {
      const provider = new BaileysQrProvider({
        bridgeUrl: 'http://72.61.232.114:3001',
      });

      const rawBaileysPayload = {
        phone: '919826012345',
        senderName: 'Amit Soni',
        message: 'नया ऑटोमेशन अपडेट आ गया',
        groupId: '120363423732680999@g.us',
        timestamp: '2026-10-18T15:00:00Z',
      };

      const event = provider.normalizeIncomingEvent(rawBaileysPayload);
      expect(event).not.toBeNull();
      expect(event?.senderPhone).toBe('919826012345');
      expect(event?.isGroup).toBe(true);
      expect(event?.groupId).toBe('120363423732680999@g.us');
      expect(event?.text).toBe('नया ऑटोमेशन अपडेट आ गया');
    });
  });
});
