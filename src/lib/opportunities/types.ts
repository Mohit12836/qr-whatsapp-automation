/**
 * Vismart 100 Revenue Opportunity Engine Types
 *
 * Mathematically evaluates customer context and interaction history
 * to formulate verified, permission-backed business opportunities.
 */

export interface OpportunityFactors {
  /** Customer need urgency (0 to 10) */
  need: number;
  /** Business service capability & fit (0 to 10) */
  fit: number;
  /** Projected profit margin score (0 to 10) */
  margin: number;
  /** Verified factual evidence score (0 to 10) - 0 if hallucinated/unsubstantiated */
  evidence: number;
  /** Explicit customer permission / opt-in (0 or 1) - strictly zero if opted out */
  permission: number;
}

export interface RevenueOpportunityCard {
  id: string;
  categoryNumber: number; // 1 to 100
  title: string;
  categoryGroup:
    | 'existing_customer_resell' // 01-10
    | 'new_customer_services'   // 11-20
    | 'lead_conversion'         // 21-30
    | 'referral_community'      // 31-40
    | 'content_marketing'       // 41-50
    | 'product_ecommerce'       // 51-60
    | 'local_professional'      // 61-70
    | 'subscription_b2b'        // 71-80
    | 'data_optimization'       // 81-90
    | 'digital_micro_saas';     // 91-100
  customerPhone: string;
  customerName?: string;
  shopName?: string;
  projectedRevenue: number; // in INR
  estimatedCost: number;    // in INR
  estimatedMargin: number;  // in INR
  evidenceText: string;     // Factual quote from customer interaction
  recommendedAction: string;
  score: number; // 0 to 10,000 normalized
  status: 'new' | 'reviewed' | 'dispatched' | 'dismissed';
}
