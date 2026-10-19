export type IndustryNiche = 
  | 'mp_online_csc' 
  | 'solar_energy' 
  | 'real_estate' 
  | 'textile_garments' 
  | 'electronics_retail' 
  | 'general_business';

export interface AuthorityPostTemplate {
  id: string;
  pillar: 'educational_value' | 'case_study_proof' | 'micro_commitment_hook';
  topic: string;
  headline: string;
  body: string;
  callToAction: string;
}

export interface TenantAutopilotProfile {
  id: string; // Tenant or Account ID (e.g. "tenant_anu_krupa" or "tenant_friend_solar")
  ownerName: string;
  businessName: string;
  phone: string;
  niche: IndustryNiche;
  channelJid?: string; // WhatsApp Channel JID (e.g. 120363281120066800@newsletter)
  targetGroupJids: string[]; // Community Groups to monitor & publish
  hidePhoneNumber?: boolean; // If true, never include personal phone number or wa.me link
  brandVoice: string; // e.g. "Helpful, authoritative, humble, solving real problems without pushy sales"
  dailySchedule: {
    morningPostTime: string; // "09:30"
    eveningHookTime: string; // "18:30"
    isAutoPilotActive: boolean;
  };
  customPillars: AuthorityPostTemplate[];
  stats: {
    totalPostsPublished: number;
    inboundLeadsGenerated: number;
    dealsClosed: number;
    lastPublishedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledExecutionResult {
  tenantId: string;
  executionType: 'morning_value' | 'evening_hook' | 'demand_scan';
  targetDestination: string;
  publishedContent: string;
  status: 'sent' | 'skipped' | 'failed';
  error?: string;
  timestamp: string;
}
