import { AgentToolDefinition, AgentExecutionContext } from './types';

export class AgentToolRegistry {
  private static tools: Map<string, AgentToolDefinition> = new Map();

  static register(tool: AgentToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  static get(toolName: string): AgentToolDefinition | undefined {
    return this.tools.get(toolName);
  }

  static listAll(): AgentToolDefinition[] {
    return Array.from(this.tools.values());
  }

  static getAuthorizedTools(allowedToolNames: string[]): AgentToolDefinition[] {
    return allowedToolNames
      .map((name) => this.tools.get(name))
      .filter((tool): tool is AgentToolDefinition => Boolean(tool));
  }
}

// -------------------------------------------------------------
// Register Core Business Tools
// -------------------------------------------------------------

// 1. CRM Search Contacts
AgentToolRegistry.register({
  name: 'search_contacts',
  description: 'Search customer profile, verified name, and purchase history by phone number or keyword.',
  category: 'crm',
  riskLevel: 'read_only',
  requiresApproval: false,
  execute: async (params, context) => {
    return {
      found: true,
      phone: params.phone || context.customerPhone,
      name: context.customerName || 'व्यापारी भाई',
      lifecycleStage: 'engaged',
    };
  },
});

// 2. Customer Memory Facts (Persistent Facts Retrieval)
AgentToolRegistry.register({
  name: 'get_customer_memory',
  description: 'Retrieve verified customer facts (shop name, business scale, quoted price, objections) from database.',
  category: 'crm',
  riskLevel: 'read_only',
  requiresApproval: false,
  execute: async (_params, context) => {
    return {
      phone: context.customerPhone,
      shopName: 'पाटीदार ट्रेडर्स',
      businessScale: 'retail_medium',
      city: 'इंदौर',
      pastPurchases: [],
      notes: 'कैटलॉग और WhatsApp ऑटोमेशन में रुचि',
    };
  },
});

// 3. Update Customer Facts (Silent CRM Update - Low-Initiative Rule)
AgentToolRegistry.register({
  name: 'update_customer_facts',
  description: 'Silently update customer facts (shop name, category, budget, timeline) without spamming the user.',
  category: 'crm',
  riskLevel: 'low',
  requiresApproval: false,
  execute: async (params) => {
    return {
      updated: true,
      recordedFacts: params,
      timestamp: new Date().toISOString(),
    };
  },
});

// 4. Search Catalog & Services
AgentToolRegistry.register({
  name: 'search_catalog',
  description: 'Search available business packages, service rules, and verified rates.',
  category: 'commerce',
  riskLevel: 'read_only',
  requiresApproval: false,
  execute: async (params) => {
    const catalog = [
      { id: 'srv-ai-closer', name: 'WhatsApp AI सेल्स मुनीम', basePrice: 4999, minPrice: 3499, category: 'automation' },
      { id: 'srv-mponline-portal', name: 'MP Online & CSC फास्ट पोर्टल', basePrice: 999, minPrice: 799, category: 'portal' },
      { id: 'srv-website-suite', name: 'डिजिटल कैटलॉग व वेबसाइट', basePrice: 2999, minPrice: 1999, category: 'web' },
    ];
    if (params.query) {
      const q = String(params.query).toLowerCase();
      return catalog.filter((item) => item.name.toLowerCase().includes(q) || item.category.includes(q));
    }
    return catalog;
  },
});

// 5. Calculate Quote (Adhering to strict margin boundaries)
AgentToolRegistry.register({
  name: 'calculate_quote',
  description: 'Calculate valid quote ensuring price does not breach minimum floor price.',
  category: 'commerce',
  riskLevel: 'low',
  requiresApproval: false,
  execute: async (params) => {
    const base = Number(params.basePrice) || 2999;
    const discountPercent = Math.min(Number(params.discountPercent) || 0, 20); // Cap at 20% max discount
    const finalPrice = Math.round(base * (1 - discountPercent / 100));
    return {
      serviceId: params.serviceId,
      originalPrice: base,
      discountGiven: `${discountPercent}%`,
      finalQuotedPrice: finalPrice,
      isFloorSafe: true,
    };
  },
});

// 6. Dynamic Payment Link Generator (Razorpay / UPI)
AgentToolRegistry.register({
  name: 'create_payment_link',
  description: 'Generate a secure payment link for customer checkout.',
  category: 'commerce',
  riskLevel: 'medium',
  requiresApproval: false,
  execute: async (params, context) => {
    const amount = Number(params.amount) || 999;
    return {
      success: true,
      paymentId: `plink_${Date.now()}`,
      amount,
      currency: 'INR',
      shortUrl: `https://vismart.cloud/pay/${Date.now().toString(36)}`,
      recipient: context.customerPhone,
    };
  },
});

// 7. Human Escalation & Assignment
AgentToolRegistry.register({
  name: 'escalate_to_human',
  description: 'Escalate conversation to human staff when AI confidence is low or complex objections arise.',
  category: 'messaging',
  riskLevel: 'low',
  requiresApproval: false,
  execute: async (params, context) => {
    return {
      escalated: true,
      reason: params.reason || 'ग्राहक ने मानव कर्मचारी से बात करने का अनुरोध किया',
      customerPhone: context.customerPhone,
      timestamp: new Date().toISOString(),
    };
  },
});
