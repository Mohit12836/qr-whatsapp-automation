import { describe, it, expect } from 'vitest';
import { OpportunityScorer } from './opportunity-scorer';
import { OpportunityFactors } from './types';

describe('Vismart 100 Revenue Opportunity Engine', () => {
  it('strictly returns 0 score if permission is not granted (zero spam protection)', () => {
    const factors: OpportunityFactors = {
      need: 10,
      fit: 10,
      margin: 10,
      evidence: 10,
      permission: 0, // Customer opted out or did not consent
    };

    const score = OpportunityScorer.calculateScore(factors);
    expect(score).toBe(0);
  });

  it('calculates full mathematical score when permission and evidence exist', () => {
    const factors: OpportunityFactors = {
      need: 9,
      fit: 8,
      margin: 9,
      evidence: 10,
      permission: 1,
    };

    const score = OpportunityScorer.calculateScore(factors);
    expect(score).toBe(9 * 8 * 9 * 10 * 1); // 6480
    expect(score).toBeGreaterThan(5000);
  });

  it('evaluates conversation and surfaces AI Sales Closer opportunity', () => {
    const conversation = [
      { role: 'user', content: 'नमस्ते भैया, मुझे अपनी दुकान के लिए व्हाट्सएप बॉट और ऑटोमेशन सिस्टम लगाना है' },
      { role: 'assistant', content: 'राम-राम भैया जी! आपकी दुकान रिटेल है या होलसेल?' },
    ];

    const cards = OpportunityScorer.evaluateConversation(
      '919826012345',
      'राजेश पाटीदार',
      conversation,
      true
    );

    expect(cards.length).toBeGreaterThan(0);
    const aiOpp = cards.find((c) => c.categoryNumber === 20);
    expect(aiOpp).toBeDefined();
    expect(aiOpp?.title).toContain('AI सेल्स मुनीम');
    expect(aiOpp?.projectedRevenue).toBe(4999);
    expect(aiOpp?.estimatedMargin).toBe(4499);
    expect(aiOpp?.score).toBeGreaterThan(0);
  });

  it('refuses to generate opportunities if customer has revoked permission', () => {
    const conversation = [
      { role: 'user', content: 'मुझे वेबसाइट और बॉट चाहिए लेकिन अभी कोई मैसेज मत भेजना' },
    ];

    const cards = OpportunityScorer.evaluateConversation(
      '919826012345',
      'राजेश पाटीदार',
      conversation,
      false // permission = false
    );

    expect(cards.length).toBe(0);
  });
});
