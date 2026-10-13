import { describe, expect, it } from 'vitest';
import {
  evaluateDiscountPolicy,
  evaluatePriceQuotePolicy,
  evaluatePaymentActionPolicy,
  evaluateActionPolicy,
  evaluateGeneratedResponseSafety,
  getFailClosedDefaultPolicy,
  roundToTwoDecimals,
  type TenantBusinessPolicy,
  type TrustedServerContext,
  type VerifiedCatalogItem,
} from './policy-guard';

describe('Deterministic AI Policy Guard (Pure Engine)', () => {
  const mockContext: TrustedServerContext = {
    accountId: 'acc-tenant-100',
    userId: 'usr-agent-200',
    userRole: 'agent',
    source: 'whatsapp_inbound',
  };

  const samplePolicy: TenantBusinessPolicy = {
    accountId: 'acc-tenant-100',
    maxDiscountPercentage: 15.0,
    minOrderAmount: 100.0,
    maxAutonomousPaymentAmount: 25000.0,
    allowAutonomousDiscounts: true,
    allowAutonomousPaymentLinks: true,
    allowAutonomousBooking: true,
    requireHumanApprovalForRefunds: true,
    requireHumanApprovalForCancellations: true,
    requireHumanApprovalForDataDeletion: true,
    version: 1,
  };

  const sampleCatalogItem: VerifiedCatalogItem = {
    skuId: 'solar-3kw-standard',
    title: '3kW Residential Rooftop Solar Kit',
    basePrice: 150000.0,
    currency: 'INR',
    maxItemDiscountPercentage: 10.0, // Item-specific ceiling lower than tenant ceiling (10% vs 15%)
    isAvailable: true,
    accountId: 'acc-tenant-100',
  };

  describe('1. Price Quote Evaluation', () => {
    it('approves a verified price when single matching catalog item is found', () => {
      const res = evaluatePriceQuotePolicy(mockContext, samplePolicy, {
        skuId: 'solar-3kw-standard',
        candidateCatalogItems: [sampleCatalogItem],
      });

      expect(res.decision).toBe('ALLOW');
      expect(res.reasonCode).toBe('PRICE_VERIFIED');
      expect(res.authorizedAmount).toBe(150000.0);
      expect(res.currency).toBe('INR');
      expect(res.requiresHumanReview).toBe(false);
    });

    it('returns NEEDS_VERIFIED_DATA when price is missing from catalog', () => {
      const res = evaluatePriceQuotePolicy(mockContext, samplePolicy, {
        skuId: 'non-existent-sku',
        candidateCatalogItems: [sampleCatalogItem],
      });

      expect(res.decision).toBe('NEEDS_VERIFIED_DATA');
      expect(res.reasonCode).toBe('PRICE_NOT_FOUND');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('returns REQUIRE_HUMAN when multiple conflicting prices exist for the same SKU', () => {
      const conflictingItem: VerifiedCatalogItem = {
        ...sampleCatalogItem,
        basePrice: 175000.0,
      };

      const res = evaluatePriceQuotePolicy(mockContext, samplePolicy, {
        skuId: 'solar-3kw-standard',
        candidateCatalogItems: [sampleCatalogItem, conflictingItem],
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('PRICE_CONFLICT');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('returns REQUIRE_HUMAN if the item is out of stock', () => {
      const outOfStockItem: VerifiedCatalogItem = {
        ...sampleCatalogItem,
        isAvailable: false,
      };

      const res = evaluatePriceQuotePolicy(mockContext, samplePolicy, {
        skuId: 'solar-3kw-standard',
        candidateCatalogItems: [outOfStockItem],
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('PRICE_OUT_OF_STOCK');
    });

    it('rejects invalid or negative base price', () => {
      const invalidPriceItem: VerifiedCatalogItem = {
        ...sampleCatalogItem,
        basePrice: -500,
      };

      const res = evaluatePriceQuotePolicy(mockContext, samplePolicy, {
        skuId: 'solar-3kw-standard',
        candidateCatalogItems: [invalidPriceItem],
      });

      expect(res.decision).toBe('DENY');
      expect(res.reasonCode).toBe('INVALID_PRICE_VALUE');
    });
  });

  describe('2. Discount Policy Evaluation', () => {
    it('approves a discount exactly at or below policy limit', () => {
      const res = evaluateDiscountPolicy(mockContext, samplePolicy, {
        requestedDiscountPercentage: 10.0,
        catalogItem: sampleCatalogItem,
      });

      expect(res.decision).toBe('ALLOW');
      expect(res.reasonCode).toBe('DISCOUNT_ALLOWED');
      expect(res.effectiveDiscountPercentage).toBe(10.0);
      expect(res.requiresHumanReview).toBe(false);
    });

    it('returns REQUIRE_HUMAN when requested discount exceeds limit', () => {
      // sampleCatalogItem has a 10% item ceiling; requested is 12%
      const res = evaluateDiscountPolicy(mockContext, samplePolicy, {
        requestedDiscountPercentage: 12.0,
        catalogItem: sampleCatalogItem,
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('DISCOUNT_EXCEEDS_LIMIT');
      expect(res.effectiveDiscountPercentage).toBe(10.0);
      expect(res.requiresHumanReview).toBe(true);
    });

    it('returns REQUIRE_HUMAN when autonomous discounts are disabled', () => {
      const strictPolicy: TenantBusinessPolicy = {
        ...samplePolicy,
        allowAutonomousDiscounts: false,
      };

      const res = evaluateDiscountPolicy(mockContext, strictPolicy, {
        requestedDiscountPercentage: 5.0,
        catalogItem: sampleCatalogItem,
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('AUTONOMOUS_DISCOUNT_DISABLED');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('always allows 0% discount even if autonomous discounts are disabled', () => {
      const strictPolicy: TenantBusinessPolicy = {
        ...samplePolicy,
        allowAutonomousDiscounts: false,
      };

      const res = evaluateDiscountPolicy(mockContext, strictPolicy, {
        requestedDiscountPercentage: 0,
        catalogItem: sampleCatalogItem,
      });

      expect(res.decision).toBe('ALLOW');
      expect(res.effectiveDiscountPercentage).toBe(0);
    });

    it('rejects invalid or negative discount percentage values', () => {
      const negativeRes = evaluateDiscountPolicy(mockContext, samplePolicy, {
        requestedDiscountPercentage: -5,
      });
      expect(negativeRes.decision).toBe('DENY');
      expect(negativeRes.reasonCode).toBe('INVALID_DISCOUNT_VALUE');

      const overHundredRes = evaluateDiscountPolicy(mockContext, samplePolicy, {
        requestedDiscountPercentage: 105,
      });
      expect(overHundredRes.decision).toBe('DENY');
      expect(overHundredRes.reasonCode).toBe('INVALID_DISCOUNT_VALUE');

      const nanRes = evaluateDiscountPolicy(mockContext, samplePolicy, {
        requestedDiscountPercentage: Number.NaN,
      });
      expect(nanRes.decision).toBe('DENY');
      expect(nanRes.reasonCode).toBe('INVALID_DISCOUNT_VALUE');
    });
  });

  describe('3. Payment Link Generation & Clamping', () => {
    const bookingItem: VerifiedCatalogItem = {
      skuId: 'token-booking',
      title: 'Site Visit Booking Token',
      basePrice: 999.0,
      currency: 'INR',
      isAvailable: true,
      accountId: 'acc-tenant-100',
    };

    it('approves payment link when model amount matches verified catalog price', () => {
      const res = evaluatePaymentActionPolicy(mockContext, samplePolicy, {
        catalogItem: bookingItem,
        requestedAmount: 999.0,
      });

      expect(res.decision).toBe('ALLOW');
      expect(res.reasonCode).toBe('PAYMENT_LINK_ALLOWED');
      expect(res.authorizedAmount).toBe(999.0);
      expect(res.requiresHumanReview).toBe(false);
    });

    it('approves payment link with approved discount calculation', () => {
      // 10% discount on ₹999 = ₹899.10
      const res = evaluatePaymentActionPolicy(mockContext, samplePolicy, {
        catalogItem: bookingItem,
        requestedAmount: 899.10,
        appliedDiscountPercentage: 10.0,
      });

      expect(res.decision).toBe('ALLOW');
      expect(res.authorizedAmount).toBe(899.10);
    });

    it('detects amount discrepancy between model hallucination and catalog truth', () => {
      // Prompt injection tried to ask for ₹1 instead of ₹999
      const res = evaluatePaymentActionPolicy(mockContext, samplePolicy, {
        catalogItem: bookingItem,
        requestedAmount: 1.0,
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('PAYMENT_AMOUNT_MISMATCH');
      expect(res.authorizedAmount).toBe(999.0);
    });

    it('rejects payment below minimum tenant order threshold', () => {
      const cheapItem: VerifiedCatalogItem = {
        skuId: 'screw-part',
        title: 'Spare Screw',
        basePrice: 50.0, // policy minOrderAmount is ₹100
        currency: 'INR',
        isAvailable: true,
        accountId: 'acc-tenant-100',
      };

      const res = evaluatePaymentActionPolicy(mockContext, samplePolicy, {
        catalogItem: cheapItem,
        requestedAmount: 50.0,
      });

      expect(res.decision).toBe('DENY');
      expect(res.reasonCode).toBe('PAYMENT_AMOUNT_BELOW_MINIMUM');
    });

    it('requires human review when amount exceeds autonomous payment cap', () => {
      // policy maxAutonomousPaymentAmount is ₹25,000; Solar kit is ₹150,000
      const res = evaluatePaymentActionPolicy(mockContext, samplePolicy, {
        catalogItem: sampleCatalogItem,
        requestedAmount: 150000.0,
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('PAYMENT_AMOUNT_EXCEEDS_CAP');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('rejects autonomous payment link generation when feature is disabled in policy', () => {
      const noPaymentsPolicy: TenantBusinessPolicy = {
        ...samplePolicy,
        allowAutonomousPaymentLinks: false,
      };

      const res = evaluatePaymentActionPolicy(mockContext, noPaymentsPolicy, {
        catalogItem: bookingItem,
        requestedAmount: 999.0,
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('AUTONOMOUS_PAYMENTS_DISABLED');
    });
  });

  describe('4. Destructive & Sensitive Actions', () => {
    it('requires human review for refund processing', () => {
      const res = evaluateActionPolicy(mockContext, samplePolicy, {
        actionType: 'process_refund',
        details: { amount: 999, reason: 'Customer requested refund' },
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('HUMAN_APPROVAL_REQUIRED');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('blocks customer data deletion autonomously', () => {
      const res = evaluateActionPolicy(mockContext, samplePolicy, {
        actionType: 'delete_customer_data',
        details: { contactId: 'contact-999' },
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('UNAUTHORIZED_DESTRUCTIVE_ACTION');
    });

    it('requires human review for knowledge activation', () => {
      const res = evaluateActionPolicy(mockContext, samplePolicy, {
        actionType: 'activate_knowledge',
        details: { stagingId: 'stg-123' },
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('HUMAN_APPROVAL_REQUIRED');
    });

    it('allows safe read and staging actions', () => {
      const readRes = evaluateActionPolicy(mockContext, samplePolicy, { actionType: 'read_knowledge' });
      expect(readRes.decision).toBe('ALLOW');

      const stageRes = evaluateActionPolicy(mockContext, samplePolicy, { actionType: 'stage_knowledge' });
      expect(stageRes.decision).toBe('ALLOW');
    });
  });

  describe('5. Fail-Closed Default Policy & Missing Context', () => {
    it('fails closed with strict default policy when tenant policy is null/undefined', () => {
      const defaultPolicy = getFailClosedDefaultPolicy('acc-tenant-100');
      expect(defaultPolicy.maxDiscountPercentage).toBe(0.0);
      expect(defaultPolicy.allowAutonomousDiscounts).toBe(false);
      expect(defaultPolicy.allowAutonomousPaymentLinks).toBe(false);

      // Testing evaluation with undefined policy falls back to fail-closed
      const res = evaluateDiscountPolicy(mockContext, undefined, {
        requestedDiscountPercentage: 5.0,
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('AUTONOMOUS_DISCOUNT_DISABLED');
    });

    it('denies execution if trusted context has no accountId', () => {
      const unauthContext = {} as TrustedServerContext;

      const res = evaluateDiscountPolicy(unauthContext, samplePolicy, {
        requestedDiscountPercentage: 5.0,
      });

      expect(res.decision).toBe('DENY');
      expect(res.reasonCode).toBe('MISSING_TRUSTED_CONTEXT');
    });
  });

  describe('6. Cross-Tenant Context Protection', () => {
    it('denies policy evaluation when policy accountId does not match server context', () => {
      const alienPolicy: TenantBusinessPolicy = {
        ...samplePolicy,
        accountId: 'acc-tenant-ALIEN-999',
      };

      const res = evaluateDiscountPolicy(mockContext, alienPolicy, {
        requestedDiscountPercentage: 5.0,
      });

      expect(res.decision).toBe('DENY');
      expect(res.reasonCode).toBe('TENANT_MISMATCH');
    });

    it('denies payment link generation if catalog item belongs to another tenant', () => {
      const alienItem: VerifiedCatalogItem = {
        ...sampleCatalogItem,
        accountId: 'acc-tenant-ALIEN-999',
      };

      const res = evaluatePaymentActionPolicy(mockContext, samplePolicy, {
        catalogItem: alienItem,
        requestedAmount: 150000.0,
      });

      expect(res.decision).toBe('DENY');
      expect(res.reasonCode).toBe('TENANT_MISMATCH');
    });
  });

  describe('7. Numeric Precision & Currency Utilities', () => {
    it('accurately rounds floating point values to 2 decimal places', () => {
      expect(roundToTwoDecimals(19.999)).toBe(20.0);
      expect(roundToTwoDecimals(10.554)).toBe(10.55);
      expect(roundToTwoDecimals(10.555)).toBe(10.56);
      expect(roundToTwoDecimals(0.1 + 0.2)).toBe(0.3);
    });
  });

  describe('8. Generated Response Safety Evaluation (P0.4B.2B.2)', () => {
    it('blocks generated responses claiming discounts when autonomous discounts are disabled', () => {
      const strictPolicy: TenantBusinessPolicy = {
        ...samplePolicy,
        allowAutonomousDiscounts: false,
      };

      const res = evaluateGeneratedResponseSafety(mockContext, strictPolicy, {
        text: 'I can offer you a special 10% discount on this plan today!',
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('UNAUTHORIZED_DISCOUNT_CLAIM');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('blocks generated responses claiming discounts exceeding tenant policy ceiling', () => {
      const res = evaluateGeneratedResponseSafety(mockContext, samplePolicy, {
        text: 'I have approved a 25% discount for your order.',
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('DISCOUNT_EXCEEDS_LIMIT');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('blocks generated responses claiming refund has been processed or issued', () => {
      const res = evaluateGeneratedResponseSafety(mockContext, samplePolicy, {
        text: 'Your refund has been processed and ₹1500 will be credited to your account.',
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('UNAUTHORIZED_REFUND_CLAIM');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('blocks generated responses claiming order or booking is cancelled', () => {
      const res = evaluateGeneratedResponseSafety(mockContext, samplePolicy, {
        text: 'I have cancelled your order #54321 as requested.',
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('UNAUTHORIZED_CANCELLATION_CLAIM');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('blocks generated responses claiming customer data or account deletion', () => {
      const res = evaluateGeneratedResponseSafety(mockContext, samplePolicy, {
        text: 'We have deleted your personal data and account records permanently.',
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('UNAUTHORIZED_DESTRUCTIVE_ACTION');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('blocks generated responses providing payment links or UPI transfer requests when disabled', () => {
      const noPaymentPolicy: TenantBusinessPolicy = {
        ...samplePolicy,
        allowAutonomousPaymentLinks: false,
      };

      const res = evaluateGeneratedResponseSafety(mockContext, noPaymentPolicy, {
        text: 'Please pay via UPI to merchant@upi or visit https://checkout.example.com/pay',
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('UNAUTHORIZED_PAYMENT_CLAIM');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('blocks unverified price quotes not present in retrieved knowledge or catalog', () => {
      const res = evaluateGeneratedResponseSafety(mockContext, samplePolicy, {
        text: 'The price for our custom setup is ₹45000.',
        retrievedKnowledge: ['Our standard consultation is free.', 'Office is located in Mumbai.'],
        candidateCatalogItems: [sampleCatalogItem], // basePrice is 150000
      });

      expect(res.decision).toBe('REQUIRE_HUMAN');
      expect(res.reasonCode).toBe('PRICE_NOT_FOUND');
      expect(res.requiresHumanReview).toBe(true);
    });

    it('allows verified price quotes grounded in retrieved knowledge', () => {
      const res = evaluateGeneratedResponseSafety(mockContext, samplePolicy, {
        text: 'The annual maintenance package costs ₹4999 per year.',
        retrievedKnowledge: [
          'Annual maintenance package is priced at ₹4999 per year including 2 service visits.',
        ],
      });

      expect(res.decision).toBe('ALLOW');
      expect(res.reasonCode).toBe('SAFE_CONVERSATIONAL_RESPONSE');
      expect(res.requiresHumanReview).toBe(false);
    });

    it('allows ordinary factual FAQ responses without unverified commitments', () => {
      const res = evaluateGeneratedResponseSafety(mockContext, samplePolicy, {
        text: 'We are open Monday to Friday from 9:00 AM to 6:00 PM IST. How else can I assist you?',
        retrievedKnowledge: ['Business hours: Mon-Fri 9 AM - 6 PM IST.'],
      });

      expect(res.decision).toBe('ALLOW');
      expect(res.reasonCode).toBe('SAFE_CONVERSATIONAL_RESPONSE');
      expect(res.requiresHumanReview).toBe(false);
    });
  });
});

