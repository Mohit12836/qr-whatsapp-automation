import { OpportunityFactors, RevenueOpportunityCard } from './types';

export class OpportunityScorer {
  /**
   * Calculates overall opportunity score based on 5-factor mathematical formula:
   * Score = Need * Fit * Margin * Evidence * Permission
   *
   * If Permission === 0, the final score is strictly 0.
   */
  static calculateScore(factors: OpportunityFactors): number {
    if (factors.permission <= 0) return 0;
    return factors.need * factors.fit * factors.margin * factors.evidence * factors.permission;
  }

  /**
   * Scans customer interaction and detects applicable revenue opportunities from the 100 catalog.
   */
  static evaluateConversation(
    customerPhone: string,
    customerName: string,
    messageHistory: Array<{ role: string; content: string }>,
    hasOptedIn: boolean = true
  ): RevenueOpportunityCard[] {
    const combinedText = messageHistory.map((m) => m.content).join(' ').toLowerCase();
    const cards: RevenueOpportunityCard[] = [];

    // Opportunity #11: Digital Catalog & Website
    if (combinedText.includes('वेबसाइट') || combinedText.includes('कैटलॉग') || combinedText.includes('online')) {
      const factors: OpportunityFactors = {
        need: 9,
        fit: 10,
        margin: 8.5,
        evidence: 9.5,
        permission: hasOptedIn ? 1 : 0,
      };

      const score = this.calculateScore(factors);
      if (score > 0) {
        cards.push({
          id: `opp-11-${Date.now()}`,
          categoryNumber: 11,
          title: 'ऑनलाइन कैटलॉग व मोबाइल वेबसाइट सेटअप',
          categoryGroup: 'new_customer_services',
          customerPhone,
          customerName,
          projectedRevenue: 2999,
          estimatedCost: 300,
          estimatedMargin: 2699,
          evidenceText: 'ग्राहक ने ऑनलाइन कैटलॉग व वेबसाइट की आवश्यकता व्यक्त की',
          recommendedAction: '1-क्लिक रेडीमेड कैटलॉग डेमो लिंक व ₹2,499 स्पेशल ऑफर भेजें',
          score,
          status: 'new',
        });
      }
    }

    // Opportunity #20: AI Customer Support & Sales Munim
    if (combinedText.includes('ऑटोमेशन') || combinedText.includes('बॉट') || combinedText.includes('स्टाफ') || combinedText.includes('मुनीम')) {
      const factors: OpportunityFactors = {
        need: 9.5,
        fit: 10,
        margin: 9,
        evidence: 9,
        permission: hasOptedIn ? 1 : 0,
      };

      const score = this.calculateScore(factors);
      if (score > 0) {
        cards.push({
          id: `opp-20-${Date.now()}`,
          categoryNumber: 20,
          title: '24/7 AI सेल्स मुनीम व ऑटो-रेस्पॉन्डर',
          categoryGroup: 'new_customer_services',
          customerPhone,
          customerName,
          projectedRevenue: 4999,
          estimatedCost: 500,
          estimatedMargin: 4499,
          evidenceText: 'ग्राहक ने व्हाट्सएप ऑटोमेशन व सेल्स मुनीम की जानकारी माँगी',
          recommendedAction: 'लाइव वॉयस/टेक्स्ट डेमो और 7-दिन का ट्रायल ऑफर प्रस्तुत करें',
          score,
          status: 'new',
        });
      }
    }

    // Opportunity #01: Repeat Re-order & Annual Maintenance (for past customers)
    if (combinedText.includes('पुराना') || combinedText.includes('रिन्यू') || combinedText.includes('साल')) {
      const factors: OpportunityFactors = {
        need: 8,
        fit: 9,
        margin: 9.5,
        evidence: 8,
        permission: hasOptedIn ? 1 : 0,
      };

      const score = this.calculateScore(factors);
      if (score > 0) {
        cards.push({
          id: `opp-01-${Date.now()}`,
          categoryNumber: 1,
          title: 'वार्षिक मेंटेनेंस व रिन्यूअल बोनस',
          categoryGroup: 'existing_customer_resell',
          customerPhone,
          customerName,
          projectedRevenue: 1999,
          estimatedCost: 150,
          estimatedMargin: 1849,
          evidenceText: 'ग्राहक ने पिछले वर्ष की सर्विस रिन्यूअल के संदर्भ में पूछा',
          recommendedAction: '15% लॉयल्टी डिस्काउंट के साथ रिन्यूअल लिंक साझा करें',
          score,
          status: 'new',
        });
      }
    }

    // Sort descending by highest score
    return cards.sort((a, b) => b.score - a.score);
  }
}
