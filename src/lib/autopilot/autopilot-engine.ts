import {
  TenantAutopilotProfile,
  AuthorityPostTemplate,
  ScheduledExecutionResult,
  IndustryNiche,
} from './types';
import * as fs from 'fs';
import * as path from 'path';

export class AutopilotEngine {
  private profiles = new Map<string, TenantAutopilotProfile>();
  private storagePath: string;

  constructor(options?: { storageDir?: string }) {
    const dir = options?.storageDir || path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
    }
    this.storagePath = path.join(dir, 'autopilot_tenants.json');
    this.loadFromDisk();

    if (this.profiles.size === 0) {
      this.seedDefaultTenants();
    }
  }

  // -------------------------------------------------------------
  // 1. Multi-Tenant Profile Management
  // -------------------------------------------------------------
  public registerTenant(profile: Omit<TenantAutopilotProfile, 'createdAt' | 'updatedAt' | 'stats'>): TenantAutopilotProfile {
    const fullProfile: TenantAutopilotProfile = {
      ...profile,
      stats: {
        totalPostsPublished: 0,
        inboundLeadsGenerated: 0,
        dealsClosed: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(profile.id, fullProfile);
    this.saveToDisk();
    return fullProfile;
  }

  public getTenant(id: string): TenantAutopilotProfile | undefined {
    return this.profiles.get(id);
  }

  public getAllTenants(): TenantAutopilotProfile[] {
    return Array.from(this.profiles.values());
  }

  public updateTenantSchedule(id: string, updates: Partial<TenantAutopilotProfile['dailySchedule']>): boolean {
    const tenant = this.profiles.get(id);
    if (!tenant) return false;
    tenant.dailySchedule = { ...tenant.dailySchedule, ...updates };
    tenant.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return true;
  }

  // -------------------------------------------------------------
  // 2. Psychology Content Generator (Value-First, 0% Pushy Sales)
  // -------------------------------------------------------------
  public generateDailyPost(tenantId: string, slot: 'morning_value' | 'evening_hook'): { text: string; pillar: string } {
    const tenant = this.profiles.get(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found.`);

    // Match templates for this slot
    const targetPillar = slot === 'morning_value' ? 'educational_value' : 'micro_commitment_hook';
    const templates = tenant.customPillars.filter(p => p.pillar === targetPillar);
    const chosen = templates.length > 0 
      ? templates[Math.floor(Math.random() * templates.length)]
      : this.getFallbackTemplate(tenant.niche, targetPillar);

    const waLink = `https://wa.me/${tenant.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Namaste, mujhe ' + chosen.topic + ' ke bare me jankari chahiye')}`;

    const text = [
      chosen.headline,
      '━━━━━━━━━━━━━━━━━━',
      chosen.body,
      '',
      chosen.callToAction,
      `👉 सीधे WhatsApp करें: ${waLink}`,
      '━━━━━━━━━━━━━━━━━━',
      `⚡ ${tenant.businessName} | विश्वसनीय डिजिटल समाधान`,
    ].join('\n');

    return { text, pillar: chosen.pillar };
  }

  // -------------------------------------------------------------
  // 3. Autopilot Execution
  // -------------------------------------------------------------
  public async executeAutopilotRun(
    tenantId: string,
    slot: 'morning_value' | 'evening_hook',
    publisher: (destinationJid: string, text: string) => Promise<boolean>
  ): Promise<ScheduledExecutionResult> {
    const tenant = this.profiles.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant '${tenantId}' not found.`);
    }

    if (!tenant.dailySchedule.isAutoPilotActive) {
      return {
        tenantId,
        executionType: slot,
        targetDestination: 'none',
        publishedContent: '',
        status: 'skipped',
        error: 'Autopilot is paused in settings',
        timestamp: new Date().toISOString(),
      };
    }

    const destination = tenant.channelJid || tenant.targetGroupJids[0];
    if (!destination) {
      return {
        tenantId,
        executionType: slot,
        targetDestination: 'none',
        publishedContent: '',
        status: 'failed',
        error: 'No valid Channel JID or Group JID configured for tenant',
        timestamp: new Date().toISOString(),
      };
    }

    const { text } = this.generateDailyPost(tenantId, slot);

    try {
      const ok = await publisher(destination, text);
      if (ok) {
        tenant.stats.totalPostsPublished += 1;
        tenant.stats.lastPublishedAt = new Date().toISOString();
        this.saveToDisk();

        return {
          tenantId,
          executionType: slot,
          targetDestination: destination,
          publishedContent: text,
          status: 'sent',
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          tenantId,
          executionType: slot,
          targetDestination: destination,
          publishedContent: text,
          status: 'failed',
          error: 'Publisher returned failure',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err) {
      return {
        tenantId,
        executionType: slot,
        targetDestination: destination,
        publishedContent: text,
        status: 'failed',
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // -------------------------------------------------------------
  // 4. Persistence (Save/Load to Disk)
  // -------------------------------------------------------------
  private saveToDisk(): void {
    try {
      const arr = Array.from(this.profiles.values());
      fs.writeFileSync(this.storagePath, JSON.stringify(arr, null, 2), 'utf-8');
    } catch {
      // Ignore if read-only filesystem
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach((t: TenantAutopilotProfile) => this.profiles.set(t.id, t));
        }
      }
    } catch {
      // Ignore
    }
  }

  // -------------------------------------------------------------
  // 5. Default Out-of-the-Box Tenants (You + 2 Friends)
  // -------------------------------------------------------------
  private seedDefaultTenants(): void {
    // 1. Primary Tenant: Anu Krupa Online (You)
    this.registerTenant({
      id: 'tenant_anu_krupa',
      ownerName: 'Admin',
      businessName: 'अनु कृपा ऑनलाइन (Anu Kruppa Online)',
      phone: '918989605297',
      niche: 'mp_online_csc',
      channelJid: '120363281120066800@newsletter',
      targetGroupJids: ['120363028449917271@g.us'],
      brandVoice: 'Humble, helpful, local MP citizen helper, reliable document solver',
      dailySchedule: {
        morningPostTime: '09:30',
        eveningHookTime: '18:30',
        isAutoPilotActive: true,
      },
      customPillars: [
        {
          id: 'p1_kyc_hack',
          pillar: 'educational_value',
          topic: 'लाड़ली बहना & समग्र ई-केवाईसी',
          headline: '📢 *समग्र ई-केवाईसी में बार-बार आ रहा एरर? यहाँ है 2 मिनट का समाधान!*',
          body: 'काफी भाइयों को आधार बायोमेट्रिक मिसमैच के कारण समग्र पोर्टल पर रिजेक्शन मिल रहा है।\n\n💡 *आसान समाधान:*\n1. पहले आधार पोर्टल पर नाम व जन्मतिथि चेक करें।\n2. यदि आधार में मोबाइल लिंक है तो OTP मोड से ही e-KYC करें (बायोमेट्रिक फिंगर से तेज होता है)।\n3. सर्वर सुबह 8 से 10 बजे सबसे तेज चलता है।',
          callToAction: '👉 अगर किसी का फॉर्म अटका है या समग्र में नाम अलग है, तो सहायता के लिए संपर्क करें:',
        },
        {
          id: 'p2_scholarship_hook',
          pillar: 'micro_commitment_hook',
          topic: 'कॉलेज स्कॉलरशिप फॉर्म',
          headline: '🎓 *कॉलेज छात्रवृत्ति (Scholarship) फॉर्म की अंतिम तिथि नजदीक!*',
          body: 'सभी विद्यार्थी ध्यान दें: आय प्रमाण पत्र और जाति प्रमाण पत्र डिजिटल हस्ताक्षर वाला होना अनिवार्य है।\nअंतिम दिनों में सर्वर डाउन होने से फॉर्म भरने से वंचित न रहें।',
          callToAction: '👉 अपना फॉर्म घर बैठे भरवाने के लिए दस्तावेज WhatsApp करें:',
        },
      ],
    });

    // 2. Friend Tenant: Solar Solutions Partner
    this.registerTenant({
      id: 'tenant_friend_solar',
      ownerName: 'Friend Solar Partner',
      businessName: 'Surya Solar & Energy Systems',
      phone: '919876543210',
      niche: 'solar_energy',
      targetGroupJids: [],
      brandVoice: 'Expert green energy consultant, subsidy specialist',
      dailySchedule: {
        morningPostTime: '10:00',
        eveningHookTime: '19:00',
        isAutoPilotActive: true,
      },
      customPillars: [
        {
          id: 'p_solar_1',
          pillar: 'educational_value',
          topic: 'पीएम सूर्य घर मुफ्त बिजली योजना',
          headline: '☀️ *3kW सोलर लगाने पर ₹78,000 की सरकारी सब्सिडी कैसे प्राप्त करें?*',
          body: 'यदि आपका मासिक बिजली बिल ₹2,500 से अधिक है, तो ऑन-ग्रिड सोलर सिस्टम से आपका बिजली बिल जीवन भर के लिए ₹0 हो सकता है।',
          callToAction: '👉 अपने घर की छत का फ्री फिजिबिलिटी सर्वे करवाने के लिए DM करें:',
        },
      ],
    });

    // 3. Friend Tenant: Real Estate Advisory
    this.registerTenant({
      id: 'tenant_friend_realestate',
      ownerName: 'Friend Property Advisor',
      businessName: 'Malwa Property & Assets',
      phone: '919111222333',
      niche: 'real_estate',
      targetGroupJids: [],
      brandVoice: 'High trust, legal verification advisor, investment counselor',
      dailySchedule: {
        morningPostTime: '11:00',
        eveningHookTime: '18:00',
        isAutoPilotActive: true,
      },
      customPillars: [
        {
          id: 'p_re_1',
          pillar: 'educational_value',
          topic: 'प्लॉट रजिस्ट्री व नामांतरण नियम',
          headline: '🏡 *प्लॉट खरीदने से पहले 3 कानूनी दस्तावेज जरूर जांचें!*',
          body: '1. टीएनसीपी (TNCP) और रेरा (RERA) अप्रूवल\n2. 13 साल की डायवर्शन रसीद व नामांतरण\n3. बैंक लोन अप्रूवल सर्टिफिकेट',
          callToAction: '👉 इंदौर/जावरा क्षेत्र में वेरीफाइड प्रॉपर्टीज की लिस्ट के लिए DM करें:',
        },
      ],
    });
  }

  private getFallbackTemplate(niche: IndustryNiche, pillar: AuthorityPostTemplate['pillar']): AuthorityPostTemplate {
    return {
      id: 'fallback_p',
      pillar,
      topic: 'दैनिक व्यवसाय अपडेट',
      headline: '💡 *व्यवसाय को आगे बढ़ाने का आज का डिजिटल मंत्र*',
      body: 'ग्राहकों का भरोसा विज्ञापन से नहीं, सही समय पर सही सेवा और गुणवत्ता से बनता है।',
      callToAction: '👉 अधिक जानकारी व परामर्श के लिए हमसे संपर्क करें:',
    };
  }
}
