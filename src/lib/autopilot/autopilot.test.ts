import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AutopilotEngine } from './autopilot-engine';
import * as fs from 'fs';
import * as path from 'path';

describe('Vismart Autopilot & Multi-Tenant Engine', () => {
  const testStorageDir = path.join(process.cwd(), 'test-data-autopilot');

  beforeEach(() => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  });

  it('initializes and seeds default tenants (Anu Krupa Online + 2 friends)', () => {
    const engine = new AutopilotEngine({ storageDir: testStorageDir });
    const tenants = engine.getAllTenants();

    expect(tenants.length).toBeGreaterThanOrEqual(3);

    const primary = engine.getTenant('tenant_anu_krupa');
    expect(primary).toBeDefined();
    expect(primary?.businessName).toContain('अनु कृपा ऑनलाइन');
    expect(primary?.channelJid).toBe('120363281120066800@newsletter');
    expect(primary?.phone).toBe('918989605297');
    expect(primary?.niche).toBe('mp_online_csc');

    const solar = engine.getTenant('tenant_friend_solar');
    expect(solar).toBeDefined();
    expect(solar?.businessName).toContain('Surya Solar');

    const re = engine.getTenant('tenant_friend_realestate');
    expect(re).toBeDefined();
    expect(re?.businessName).toContain('Malwa Property');
  });

  it('allows registering a new friend or SaaS client tenant', () => {
    const engine = new AutopilotEngine({ storageDir: testStorageDir });
    const newTenant = engine.registerTenant({
      id: 'tenant_friend_textiles',
      ownerName: 'Vikas Sharma',
      businessName: 'Sharma Sarees & Kurtis Wholesale',
      phone: '919826099999',
      niche: 'textile_garments',
      targetGroupJids: ['120363111222333444@g.us'],
      brandVoice: 'Friendly textile wholesaler, bulk discount advisor',
      dailySchedule: {
        morningPostTime: '09:00',
        eveningHookTime: '20:00',
        isAutoPilotActive: true,
      },
      customPillars: [
        {
          id: 'p_cloth_1',
          pillar: 'educational_value',
          topic: 'सूरत कुर्ती होलसेल लॉट',
          headline: '👗 *सूरत मिल रेट पर 100% प्योर कॉटन कुर्तियां*',
          body: 'दुकानदारों के लिए नया रक्षाबंधन व दिवाली कलेक्शन उपलब्ध है। सीधा मिल भाव।',
          callToAction: '👉 कैटलॉग और होलसेल रेट लिस्ट WhatsApp पर पाने के लिए DM करें:',
        },
      ],
    });

    expect(newTenant.id).toBe('tenant_friend_textiles');
    expect(newTenant.stats.totalPostsPublished).toBe(0);

    const retrieved = engine.getTenant('tenant_friend_textiles');
    expect(retrieved?.ownerName).toBe('Vikas Sharma');
  });

  it('generates high-value psychology posts for morning value and evening hook slots', () => {
    const engine = new AutopilotEngine({ storageDir: testStorageDir });

    const morningPost = engine.generateDailyPost('tenant_anu_krupa', 'morning_value');
    expect(morningPost.pillar).toBe('educational_value');
    expect(morningPost.text).toContain('अनु कृपा ऑनलाइन');
    expect(morningPost.text).toContain('wa.me/918989605297');

    const eveningPost = engine.generateDailyPost('tenant_anu_krupa', 'evening_hook');
    expect(eveningPost.pillar).toBe('micro_commitment_hook');
    expect(eveningPost.text).toContain('wa.me/918989605297');
  });

  it('successfully executes autopilot run and records publication metrics', async () => {
    const engine = new AutopilotEngine({ storageDir: testStorageDir });
    let publishedJid = '';
    let publishedBody = '';

    const mockPublisher = async (jid: string, text: string) => {
      publishedJid = jid;
      publishedBody = text;
      return true;
    };

    const result = await engine.executeAutopilotRun(
      'tenant_anu_krupa',
      'morning_value',
      mockPublisher
    );

    expect(result.status).toBe('sent');
    expect(result.targetDestination).toBe('120363281120066800@newsletter');
    expect(publishedJid).toBe('120363281120066800@newsletter');
    expect(publishedBody.length).toBeGreaterThan(20);

    const updated = engine.getTenant('tenant_anu_krupa');
    expect(updated?.stats.totalPostsPublished).toBe(1);
    expect(updated?.stats.lastPublishedAt).toBeDefined();
  });

  it('skips publication when autopilot is deactivated in settings', async () => {
    const engine = new AutopilotEngine({ storageDir: testStorageDir });
    engine.updateTenantSchedule('tenant_anu_krupa', { isAutoPilotActive: false });

    const result = await engine.executeAutopilotRun(
      'tenant_anu_krupa',
      'morning_value',
      async () => true
    );

    expect(result.status).toBe('skipped');
    expect(result.error).toContain('paused');
  });

  it('preserves tenant data across engine instances (persistent JSON storage)', () => {
    const engine1 = new AutopilotEngine({ storageDir: testStorageDir });
    engine1.registerTenant({
      id: 'tenant_custom_saved',
      ownerName: 'Persistent User',
      businessName: 'Zero Loss Auto Corp',
      phone: '918888877777',
      niche: 'electronics_retail',
      targetGroupJids: [],
      brandVoice: 'Sharp tech dealer',
      dailySchedule: {
        morningPostTime: '08:00',
        eveningHookTime: '21:00',
        isAutoPilotActive: true,
      },
      customPillars: [],
    });

    // Create a new instance pointing to the same directory
    const engine2 = new AutopilotEngine({ storageDir: testStorageDir });
    const loaded = engine2.getTenant('tenant_custom_saved');

    expect(loaded).toBeDefined();
    expect(loaded?.businessName).toBe('Zero Loss Auto Corp');
    expect(loaded?.phone).toBe('918888877777');
  });
});
