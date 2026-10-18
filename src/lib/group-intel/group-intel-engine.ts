import {
  GroupMessageEvent,
  DemandSignal,
  GroupTopicCluster,
  CommunityRadarMetrics,
  IntentCategory,
} from './types';

export class GroupIntelEngine {
  private signals: DemandSignal[] = [];
  private monitoredGroups = new Map<string, { groupName: string; memberCount: number }>();

  // Commercial intent keyword lexicons (Hindi + English)
  private readonly BUYING_KEYWORDS = [
    'chahiye', 'need', 'want to buy', 'looking for', 'kharidna', 'requirement',
    'require', 'urgent need', 'purchase', 'order karna hai'
  ];

  private readonly SUPPLIER_KEYWORDS = [
    'supplier', 'vendor', 'dealer', 'distributor', 'manufacturer', 'kaun supply karta hai',
    'kiske paas hai', 'available hai kya'
  ];

  private readonly PRICE_KEYWORDS = [
    'price', 'rate', 'cost', 'quotation', 'kitne ka padega', 'kitna lagega',
    'rate list', 'best price', 'discount', 'bhav'
  ];

  constructor(initialGroups?: { groupId: string; groupName: string; memberCount: number }[]) {
    if (initialGroups) {
      initialGroups.forEach(g => this.monitoredGroups.set(g.groupId, { groupName: g.groupName, memberCount: g.memberCount }));
    }
  }

  public registerGroup(groupId: string, groupName: string, memberCount: number = 200): void {
    this.monitoredGroups.set(groupId, { groupName, memberCount });
  }

  public ingestGroupMessage(event: GroupMessageEvent): DemandSignal | null {
    // Keep monitored groups updated
    if (!this.monitoredGroups.has(event.groupId)) {
      this.monitoredGroups.set(event.groupId, { groupName: event.groupName, memberCount: 200 });
    }

    const textLower = event.text.toLowerCase();
    const matchedBuying = this.BUYING_KEYWORDS.filter(k => textLower.includes(k));
    const matchedSupplier = this.SUPPLIER_KEYWORDS.filter(k => textLower.includes(k));
    const matchedPrice = this.PRICE_KEYWORDS.filter(k => textLower.includes(k));

    let category: IntentCategory = 'general_chat';
    let matchedKeywords: string[] = [];
    let confidence = 0;

    if (matchedBuying.length > 0) {
      category = 'buying_intent';
      matchedKeywords = matchedBuying;
      confidence = 0.85 + Math.min(matchedBuying.length * 0.05, 0.15);
    } else if (matchedSupplier.length > 0) {
      category = 'supplier_inquiry';
      matchedKeywords = matchedSupplier;
      confidence = 0.8;
    } else if (matchedPrice.length > 0) {
      category = 'price_check';
      matchedKeywords = matchedPrice;
      confidence = 0.75;
    } else {
      // General banter, ignore for commercial signal radar
      return null;
    }

    const signal: DemandSignal = {
      id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      groupId: event.groupId,
      groupName: event.groupName,
      intentCategory: category,
      confidenceScore: confidence,
      matchedKeywords,
      anonymizedSenderHash: event.anonymizedSenderHash,
      snippet: event.text.slice(0, 160),
      detectedAt: event.timestamp || new Date().toISOString(),
    };

    this.signals.unshift(signal);
    // Keep last 1,000 signals in memory
    if (this.signals.length > 1000) {
      this.signals.pop();
    }

    return signal;
  }

  public getDemandSignals(filter?: { category?: IntentCategory; minConfidence?: number }): DemandSignal[] {
    return this.signals.filter(s => {
      if (filter?.category && s.intentCategory !== filter.category) return false;
      if (filter?.minConfidence && s.confidenceScore < filter.minConfidence) return false;
      return true;
    });
  }

  public clusterFaqTopics(): GroupTopicCluster[] {
    const topicBuckets = new Map<string, { title: string; category: IntentCategory; questions: string[] }>();

    for (const sig of this.signals) {
      const mainKeyword = sig.matchedKeywords[0] || 'general';
      const bucketKey = `${sig.intentCategory}:${mainKeyword}`;

      if (!topicBuckets.has(bucketKey)) {
        let title = '';
        let rec = '';
        if (sig.intentCategory === 'buying_intent') {
          title = `High Demand: Inquiry for items matching "${mainKeyword}"`;
          rec = 'Publish an official product catalog or brochure in business profile';
        } else if (sig.intentCategory === 'price_check') {
          title = `Frequent Pricing Inquiry: Quotes relating to "${mainKeyword}"`;
          rec = 'Create a quick-reply pricing template or rate card';
        } else {
          title = `Supplier & Availability Questions: "${mainKeyword}"`;
          rec = 'Prepare an instant stock status message';
        }

        topicBuckets.set(bucketKey, {
          title,
          category: sig.intentCategory,
          questions: [],
        });
      }

      const bucket = topicBuckets.get(bucketKey)!;
      if (bucket.questions.length < 5) {
        bucket.questions.push(sig.snippet);
      }
    }

    return Array.from(topicBuckets.entries()).map(([key, val], idx) => ({
      topicId: `topic_${idx + 1}`,
      title: val.title,
      category: val.category,
      frequency: val.questions.length,
      sampleQuestions: val.questions,
      recommendedAction: val.category === 'price_check' 
        ? 'Deploy auto-quote generator' 
        : 'Update agent knowledge base',
    }));
  }

  public getRadarMetrics(): CommunityRadarMetrics {
    let totalMembers = 0;
    this.monitoredGroups.forEach(g => {
      totalMembers += g.memberCount;
    });

    const highIntent = this.signals.filter(s => s.confidenceScore >= 0.8).length;

    return {
      monitoredGroupsCount: this.monitoredGroups.size,
      estimatedMemberReach: totalMembers,
      totalSignalsDetected: this.signals.length,
      highIntentSignalsCount: highIntent,
      topTopics: this.clusterFaqTopics().slice(0, 5),
    };
  }
}
