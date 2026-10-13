// ============================================================
// Deterministic AI Business Policy Guard
//
// Pure, deterministic, server-side policy evaluator for AI actions.
// Never trusts LLM self-authorization or unverified strings.
//
// Guarantees:
//   1. Zero autonomous discounts unless explicitly enabled.
//   2. Hard ceiling enforcement on discounts against tenant policy.
//   3. Prices strictly bound to verified catalog/business data.
//   4. Missing, conflicting, or unverified prices fail closed.
//   5. Financial actions (payment links, refunds) require deterministic verification.
//   6. Destructive actions (refunds, customer deletion) require human authorization.
//   7. Strict tenant isolation verified against trusted server context.
// ============================================================

export type PolicyDecision =
  | 'ALLOW'
  | 'DENY'
  | 'REQUIRE_HUMAN'
  | 'NEEDS_VERIFIED_DATA';

export type PolicyReasonCode =
  | 'DISCOUNT_ALLOWED'
  | 'DISCOUNT_EXCEEDS_LIMIT'
  | 'AUTONOMOUS_DISCOUNT_DISABLED'
  | 'INVALID_DISCOUNT_VALUE'
  | 'PRICE_VERIFIED'
  | 'PRICE_NOT_FOUND'
  | 'PRICE_CONFLICT'
  | 'PRICE_OUT_OF_STOCK'
  | 'INVALID_PRICE_VALUE'
  | 'PAYMENT_LINK_ALLOWED'
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'PAYMENT_AMOUNT_EXCEEDS_CAP'
  | 'PAYMENT_AMOUNT_BELOW_MINIMUM'
  | 'AUTONOMOUS_PAYMENTS_DISABLED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNAUTHORIZED_DESTRUCTIVE_ACTION'
  | 'UNAUTHORIZED_ACTION'
  | 'TENANT_MISMATCH'
  | 'MISSING_POLICY_FAIL_CLOSED'
  | 'MISSING_TRUSTED_CONTEXT'
  | 'INVALID_NUMERIC_INPUT'
  | 'UNVERIFIED_PRICE_CLAIM'
  | 'UNAUTHORIZED_DISCOUNT_CLAIM'
  | 'UNAUTHORIZED_PAYMENT_CLAIM'
  | 'UNAUTHORIZED_REFUND_CLAIM'
  | 'UNAUTHORIZED_CANCELLATION_CLAIM'
  | 'SAFE_CONVERSATIONAL_RESPONSE';

export type ActionType =
  | 'read_knowledge'
  | 'quote_price'
  | 'apply_discount'
  | 'generate_payment_link'
  | 'create_booking'
  | 'modify_booking'
  | 'cancel_booking'
  | 'process_refund'
  | 'delete_customer_data'
  | 'send_bulk_message'
  | 'stage_knowledge'
  | 'activate_knowledge';

export interface TrustedServerContext {
  accountId: string;
  userId?: string;
  userRole?: 'owner' | 'admin' | 'agent' | 'viewer';
  source: 'whatsapp_inbound' | 'web_dashboard' | 'system_cron';
}

export interface TenantBusinessPolicy {
  accountId: string;
  currency?: string;
  maxDiscountPercentage: number; // e.g. 10.0 for 10%
  minOrderAmount: number; // e.g. 1.0 for ₹1
  maxAutonomousPaymentAmount: number; // e.g. 50000.0 for ₹50,000
  allowAutonomousDiscounts: boolean;
  allowAutonomousPaymentLinks: boolean;
  allowAutonomousBooking: boolean;
  requireHumanApprovalForRefunds: boolean;
  requireHumanApprovalForCancellations: boolean;
  requireHumanApprovalForDataDeletion: boolean;
  allowedAutonomousActions?: readonly ActionType[];
  version?: number;
}

export interface VerifiedCatalogItem {
  skuId: string;
  title: string;
  basePrice: number;
  currency: string;
  maxItemDiscountPercentage?: number;
  isAvailable: boolean;
  accountId?: string;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reasonCode: PolicyReasonCode;
  message: string;
  effectiveDiscountPercentage?: number;
  authorizedAmount?: number;
  currency?: string;
  requiresHumanReview: boolean;
}

export interface DiscountEvaluationRequest {
  requestedDiscountPercentage: number;
  catalogItem?: VerifiedCatalogItem;
  targetPrice?: number;
}

export interface PriceQuoteRequest {
  skuId: string;
  candidateCatalogItems: readonly VerifiedCatalogItem[];
}

export interface PaymentLinkEvaluationRequest {
  catalogItem: VerifiedCatalogItem;
  requestedAmount: number;
  appliedDiscountPercentage?: number;
}

export interface ActionEvaluationRequest {
  actionType: ActionType;
  details?: Record<string, unknown>;
}

/**
 * Strict fail-closed fallback policy when tenant has no custom policy row in DB.
 */
export function getFailClosedDefaultPolicy(accountId: string): TenantBusinessPolicy {
  return {
    accountId,
    currency: 'INR',
    maxDiscountPercentage: 0.0,
    minOrderAmount: 1.0,
    maxAutonomousPaymentAmount: 0.0,
    allowAutonomousDiscounts: false,
    allowAutonomousPaymentLinks: false,
    allowAutonomousBooking: false,
    requireHumanApprovalForRefunds: true,
    requireHumanApprovalForCancellations: true,
    requireHumanApprovalForDataDeletion: true,
    allowedAutonomousActions: ['read_knowledge', 'quote_price', 'stage_knowledge'],
    version: 1,
  };
}

/**
 * Helper to validate positive finite numeric values.
 */
function isValidFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val);
}

/**
 * Round to 2 decimal places to avoid IEEE-754 precision quirks.
 */
export function roundToTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * 1. Evaluate Discount Requests against Tenant Policy and Verified Catalog Bounds.
 */
export function evaluateDiscountPolicy(
  context: TrustedServerContext,
  policy: TenantBusinessPolicy | null | undefined,
  request: DiscountEvaluationRequest
): PolicyEvaluationResult {
  if (!context?.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'MISSING_TRUSTED_CONTEXT',
      message: 'Trusted server context with accountId is required.',
      requiresHumanReview: true,
    };
  }

  const effectivePolicy = policy ?? getFailClosedDefaultPolicy(context.accountId);

  if (effectivePolicy.accountId !== context.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'TENANT_MISMATCH',
      message: 'Policy account ID does not match server context.',
      requiresHumanReview: true,
    };
  }

  const { requestedDiscountPercentage, catalogItem } = request;

  if (!isValidFiniteNumber(requestedDiscountPercentage) || requestedDiscountPercentage < 0 || requestedDiscountPercentage > 100) {
    return {
      decision: 'DENY',
      reasonCode: 'INVALID_DISCOUNT_VALUE',
      message: 'Discount percentage must be a valid number between 0 and 100.',
      requiresHumanReview: false,
    };
  }

  // Zero discount is always allowed without autonomous discount toggle
  if (requestedDiscountPercentage === 0) {
    return {
      decision: 'ALLOW',
      reasonCode: 'DISCOUNT_ALLOWED',
      message: 'Zero discount request approved.',
      effectiveDiscountPercentage: 0,
      requiresHumanReview: false,
    };
  }

  if (!effectivePolicy.allowAutonomousDiscounts) {
    return {
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'AUTONOMOUS_DISCOUNT_DISABLED',
      message: 'Autonomous discounts are disabled for this workspace. Human agent approval required.',
      requiresHumanReview: true,
    };
  }

  const maxAllowed = roundToTwoDecimals(effectivePolicy.maxDiscountPercentage);
  const requested = roundToTwoDecimals(requestedDiscountPercentage);

  // Check item-level discount cap if specified on the catalog item
  let ceiling = maxAllowed;
  if (catalogItem && isValidFiniteNumber(catalogItem.maxItemDiscountPercentage)) {
    ceiling = Math.min(maxAllowed, roundToTwoDecimals(catalogItem.maxItemDiscountPercentage));
  }

  if (requested > ceiling) {
    return {
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'DISCOUNT_EXCEEDS_LIMIT',
      message: `Requested discount of ${requested}% exceeds maximum allowable threshold of ${ceiling}%.`,
      effectiveDiscountPercentage: ceiling,
      requiresHumanReview: true,
    };
  }

  return {
    decision: 'ALLOW',
    reasonCode: 'DISCOUNT_ALLOWED',
    message: `Discount of ${requested}% is within policy limit of ${ceiling}%.`,
    effectiveDiscountPercentage: requested,
    requiresHumanReview: false,
  };
}

/**
 * 2. Evaluate Price Quotes from Verified Catalog Items.
 * Guarantees that AI cannot guess or invent prices when items are missing or conflicting.
 */
export function evaluatePriceQuotePolicy(
  context: TrustedServerContext,
  _policy: TenantBusinessPolicy | null | undefined,
  request: PriceQuoteRequest
): PolicyEvaluationResult {
  if (!context?.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'MISSING_TRUSTED_CONTEXT',
      message: 'Trusted server context with accountId is required.',
      requiresHumanReview: true,
    };
  }

  const { skuId, candidateCatalogItems } = request;

  if (!skuId || typeof skuId !== 'string' || !skuId.trim()) {
    return {
      decision: 'NEEDS_VERIFIED_DATA',
      reasonCode: 'PRICE_NOT_FOUND',
      message: 'SKU identifier is missing.',
      requiresHumanReview: true,
    };
  }

  const matchingItems = (candidateCatalogItems || []).filter(
    (item) => item.skuId === skuId && (!item.accountId || item.accountId === context.accountId)
  );

  if (matchingItems.length === 0) {
    return {
      decision: 'NEEDS_VERIFIED_DATA',
      reasonCode: 'PRICE_NOT_FOUND',
      message: `No verified catalog price found for SKU '${skuId}'. AI must not invent price.`,
      requiresHumanReview: true,
    };
  }

  if (matchingItems.length > 1) {
    // Detect conflicting prices for the same SKU
    const prices = new Set(matchingItems.map((i) => i.basePrice));
    if (prices.size > 1) {
      return {
        decision: 'REQUIRE_HUMAN',
        reasonCode: 'PRICE_CONFLICT',
        message: `Conflicting price entries detected for SKU '${skuId}'. Human verification required.`,
        requiresHumanReview: true,
      };
    }
  }

  const item = matchingItems[0];

  if (!isValidFiniteNumber(item.basePrice) || item.basePrice < 0) {
    return {
      decision: 'DENY',
      reasonCode: 'INVALID_PRICE_VALUE',
      message: `Catalog item '${skuId}' has an invalid base price.`,
      requiresHumanReview: true,
    };
  }

  if (!item.isAvailable) {
    return {
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'PRICE_OUT_OF_STOCK',
      message: `Item '${skuId}' is currently marked unavailable or out of stock.`,
      requiresHumanReview: true,
    };
  }

  return {
    decision: 'ALLOW',
    reasonCode: 'PRICE_VERIFIED',
    message: `Verified price for '${item.title}' is ${item.currency} ${item.basePrice}.`,
    authorizedAmount: roundToTwoDecimals(item.basePrice),
    currency: item.currency || 'INR',
    requiresHumanReview: false,
  };
}

/**
 * 3. Evaluate Payment Link Generation Requests.
 * Checks that the amount matches the verified catalog calculation and complies with floor/ceiling rules.
 */
export function evaluatePaymentActionPolicy(
  context: TrustedServerContext,
  policy: TenantBusinessPolicy | null | undefined,
  request: PaymentLinkEvaluationRequest
): PolicyEvaluationResult {
  if (!context?.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'MISSING_TRUSTED_CONTEXT',
      message: 'Trusted server context with accountId is required.',
      requiresHumanReview: true,
    };
  }

  const effectivePolicy = policy ?? getFailClosedDefaultPolicy(context.accountId);

  if (effectivePolicy.accountId !== context.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'TENANT_MISMATCH',
      message: 'Policy account ID does not match server context.',
      requiresHumanReview: true,
    };
  }

  if (!effectivePolicy.allowAutonomousPaymentLinks) {
    return {
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'AUTONOMOUS_PAYMENTS_DISABLED',
      message: 'Autonomous payment link creation is disabled. Requires human agent creation.',
      requiresHumanReview: true,
    };
  }

  const { catalogItem, requestedAmount, appliedDiscountPercentage = 0 } = request;

  if (!catalogItem || !isValidFiniteNumber(catalogItem.basePrice) || catalogItem.basePrice <= 0) {
    return {
      decision: 'NEEDS_VERIFIED_DATA',
      reasonCode: 'PRICE_NOT_FOUND',
      message: 'A verified catalog item with valid base price is required to generate payment links.',
      requiresHumanReview: true,
    };
  }

  if (catalogItem.accountId && catalogItem.accountId !== context.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'TENANT_MISMATCH',
      message: 'Catalog item belongs to another workspace.',
      requiresHumanReview: true,
    };
  }

  if (!isValidFiniteNumber(requestedAmount) || requestedAmount <= 0) {
    return {
      decision: 'DENY',
      reasonCode: 'INVALID_NUMERIC_INPUT',
      message: 'Requested payment amount must be a positive number.',
      requiresHumanReview: false,
    };
  }

  // Validate discount boundary first
  const discountEval = evaluateDiscountPolicy(context, effectivePolicy, {
    requestedDiscountPercentage: appliedDiscountPercentage,
    catalogItem,
  });

  if (discountEval.decision !== 'ALLOW') {
    return discountEval;
  }

  // Calculate expected price deterministically
  const discountMultiplier = (100 - (discountEval.effectiveDiscountPercentage ?? 0)) / 100;
  const expectedAmount = roundToTwoDecimals(catalogItem.basePrice * discountMultiplier);
  const candidateAmount = roundToTwoDecimals(requestedAmount);

  // Disallow discrepancy between model-supplied amount and catalog calculation
  if (Math.abs(expectedAmount - candidateAmount) > 0.01) {
    return {
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'PAYMENT_AMOUNT_MISMATCH',
      message: `Requested amount (${candidateAmount}) does not match verified catalog calculation (${expectedAmount}).`,
      authorizedAmount: expectedAmount,
      currency: catalogItem.currency,
      requiresHumanReview: true,
    };
  }

  // Check minimum order floor
  if (expectedAmount < effectivePolicy.minOrderAmount) {
    return {
      decision: 'DENY',
      reasonCode: 'PAYMENT_AMOUNT_BELOW_MINIMUM',
      message: `Amount ${expectedAmount} is below tenant minimum threshold of ${effectivePolicy.minOrderAmount}.`,
      requiresHumanReview: false,
    };
  }

  // Check maximum autonomous payment cap
  if (expectedAmount > effectivePolicy.maxAutonomousPaymentAmount) {
    return {
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'PAYMENT_AMOUNT_EXCEEDS_CAP',
      message: `Amount ${expectedAmount} exceeds autonomous ceiling of ${effectivePolicy.maxAutonomousPaymentAmount}. Human approval required.`,
      authorizedAmount: expectedAmount,
      currency: catalogItem.currency,
      requiresHumanReview: true,
    };
  }

  return {
    decision: 'ALLOW',
    reasonCode: 'PAYMENT_LINK_ALLOWED',
    message: `Payment link generation approved for ${catalogItem.currency} ${expectedAmount}.`,
    authorizedAmount: expectedAmount,
    currency: catalogItem.currency || 'INR',
    effectiveDiscountPercentage: discountEval.effectiveDiscountPercentage,
    requiresHumanReview: false,
  };
}

/**
 * 4. Evaluate Destructive and Sensitive Business Actions.
 * Enforces human-in-the-loop for refunds, cancellations, and customer data deletion.
 */
export function evaluateActionPolicy(
  context: TrustedServerContext,
  policy: TenantBusinessPolicy | null | undefined,
  request: ActionEvaluationRequest
): PolicyEvaluationResult {
  if (!context?.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'MISSING_TRUSTED_CONTEXT',
      message: 'Trusted server context with accountId is required.',
      requiresHumanReview: true,
    };
  }

  const effectivePolicy = policy ?? getFailClosedDefaultPolicy(context.accountId);

  if (effectivePolicy.accountId !== context.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'TENANT_MISMATCH',
      message: 'Policy account ID does not match server context.',
      requiresHumanReview: true,
    };
  }

  const { actionType } = request;

  switch (actionType) {
    case 'process_refund':
      return {
        decision: effectivePolicy.requireHumanApprovalForRefunds ? 'REQUIRE_HUMAN' : 'DENY',
        reasonCode: 'HUMAN_APPROVAL_REQUIRED',
        message: 'Refund requests require manual human verification and approval.',
        requiresHumanReview: true,
      };

    case 'delete_customer_data':
      return {
        decision: effectivePolicy.requireHumanApprovalForDataDeletion ? 'REQUIRE_HUMAN' : 'DENY',
        reasonCode: 'UNAUTHORIZED_DESTRUCTIVE_ACTION',
        message: 'Customer data deletion cannot be executed autonomously by AI.',
        requiresHumanReview: true,
      };

    case 'cancel_booking':
      if (effectivePolicy.requireHumanApprovalForCancellations) {
        return {
          decision: 'REQUIRE_HUMAN',
          reasonCode: 'HUMAN_APPROVAL_REQUIRED',
          message: 'Booking cancellation requires human agent review.',
          requiresHumanReview: true,
        };
      }
      return {
        decision: 'ALLOW',
        reasonCode: 'UNAUTHORIZED_ACTION',
        message: 'Booking cancellation permitted by tenant policy.',
        requiresHumanReview: false,
      };

    case 'read_knowledge':
    case 'stage_knowledge':
      return {
        decision: 'ALLOW',
        reasonCode: 'DISCOUNT_ALLOWED',
        message: 'Safe read/staging operation allowed.',
        requiresHumanReview: false,
      };

    case 'activate_knowledge':
      // Direct autonomous activation is forbidden (must pass through P0.3.1 approval radar)
      return {
        decision: 'REQUIRE_HUMAN',
        reasonCode: 'HUMAN_APPROVAL_REQUIRED',
        message: 'Knowledge activation requires explicit owner/admin approval.',
        requiresHumanReview: true,
      };

    case 'send_bulk_message':
      return {
        decision: 'REQUIRE_HUMAN',
        reasonCode: 'HUMAN_APPROVAL_REQUIRED',
        message: 'Broadcast sends require human review and template approval.',
        requiresHumanReview: true,
      };

    default:
      return {
        decision: 'DENY',
        reasonCode: 'UNAUTHORIZED_ACTION',
        message: `Action '${actionType}' is not permitted by policy.`,
        requiresHumanReview: true,
      };
  }
}

export interface ResponseSafetyRequest {
  text: string;
  retrievedKnowledge?: readonly string[];
  candidateCatalogItems?: readonly VerifiedCatalogItem[];
}

/**
 * 5. Evaluate Generated Model Response Safety (P0.4B.2B.2).
 * Intercepts LLM text BEFORE outbound transmission to WhatsApp.
 * Verifies that:
 *   - No unverified discount concessions are promised.
 *   - No unverified payment links / UPI transfers are requested.
 *   - No autonomous refunds, cancellations, or data deletions are confirmed.
 *   - No hallucinated prices are stated without grounding in knowledge/catalog.
 *   - Safe factual FAQ answers are preserved.
 */
export function evaluateGeneratedResponseSafety(
  context: TrustedServerContext,
  policy: TenantBusinessPolicy | null | undefined,
  request: ResponseSafetyRequest
): PolicyEvaluationResult {
  if (!context?.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'MISSING_TRUSTED_CONTEXT',
      message: 'Trusted server context with accountId is required.',
      requiresHumanReview: true,
    };
  }

  const effectivePolicy = policy ?? getFailClosedDefaultPolicy(context.accountId);

  if (effectivePolicy.accountId !== context.accountId) {
    return {
      decision: 'DENY',
      reasonCode: 'TENANT_MISMATCH',
      message: 'Policy account ID does not match server context.',
      requiresHumanReview: true,
    };
  }

  const text = request.text?.trim() || '';
  if (!text) {
    return {
      decision: 'ALLOW',
      reasonCode: 'SAFE_CONVERSATIONAL_RESPONSE',
      message: 'Empty response text.',
      requiresHumanReview: false,
    };
  }

  // 1. Refund Claim Check
  const REFUND_CLAIM_REGEX = /\b(?:refund(?:ed)?\s+(?:has\s+been|is|was|will\s+be)\s+(?:processed|initiated|issued|approved|sent|granted|completed)|process(?:ing|ed)?\s+(?:your\s+)?refund|issu(?:ing|ed)\s+(?:a\s+)?refund|refund\s+amount\s+of|money\s+will\s+be\s+refunded)\b/i;
  if (REFUND_CLAIM_REGEX.test(text)) {
    if (effectivePolicy.requireHumanApprovalForRefunds) {
      return {
        decision: 'REQUIRE_HUMAN',
        reasonCode: 'UNAUTHORIZED_REFUND_CLAIM',
        message: 'Generated response contains an autonomous refund commitment. Human verification required.',
        requiresHumanReview: true,
      };
    }
  }

  // 2. Cancellation Claim Check
  const CANCELLATION_CLAIM_REGEX = /\b(?:(?:order|booking|reservation|subscription)\s+(?:has\s+been|is|was)\s+(?:cancell?ed|terminated)|cancell?ed\s+your\s+(?:order|booking|reservation|subscription))\b/i;
  if (CANCELLATION_CLAIM_REGEX.test(text)) {
    if (effectivePolicy.requireHumanApprovalForCancellations) {
      return {
        decision: 'REQUIRE_HUMAN',
        reasonCode: 'UNAUTHORIZED_CANCELLATION_CLAIM',
        message: 'Generated response contains an autonomous cancellation claim. Human agent review required.',
        requiresHumanReview: true,
      };
    }
  }

  // 3. Destructive Deletion Claim Check
  const DELETION_CLAIM_REGEX = /\b(?:(?:delet(?:ed|ing)|eras(?:ed|ing)|purg(?:ed|ing)|remov(?:ed|ing))\s+your\s+(?:account|data|personal\s+(?:data|information)|profile|records)|(?:account|data|records)\s+(?:has\s+been|is|were)\s+(?:deleted|erased|purged))\b/i;
  if (DELETION_CLAIM_REGEX.test(text)) {
    if (effectivePolicy.requireHumanApprovalForDataDeletion) {
      return {
        decision: 'REQUIRE_HUMAN',
        reasonCode: 'UNAUTHORIZED_DESTRUCTIVE_ACTION',
        message: 'Generated response claims customer data or account deletion. Human review required.',
        requiresHumanReview: true,
      };
    }
  }

  // 4. Payment Link / Collection Claim Check
  const PAYMENT_CLAIM_REGEX = /\b(?:(?:pay(?:ment)?\s+(?:link|url|via|using|at|to)\s+(?:is|:|upi|razorpay|stripe|bank|account))|(?:transfer\s+(?:the\s+)?(?:amount|funds|money)\s+to)|(?:send\s+(?:payment|money)\s+to\s+upi)|(?:upi\s*id\s*[:=])|https?:\/\/[^\s]+(?:pay|rzp|stripe|bill))\b/i;
  if (PAYMENT_CLAIM_REGEX.test(text)) {
    if (!effectivePolicy.allowAutonomousPaymentLinks) {
      return {
        decision: 'REQUIRE_HUMAN',
        reasonCode: 'UNAUTHORIZED_PAYMENT_CLAIM',
        message: 'Generated response contains payment instructions or links while autonomous payments are disabled.',
        requiresHumanReview: true,
      };
    }
  }

  // 5. Discount Claim Check
  const DISCOUNT_PROMISE_REGEX = /(?:(\d+(?:\.\d+)?)\s*%\s*(?:discount|off|concession|reduction))|(?:(?:discount|off)\s+of\s+(\d+(?:\.\d+)?)\s*%)|(?:giving\s+you\s+(?:a\s+)?(\d+(?:\.\d+)?)\s*%\s*discount)/i;
  const discountMatch = text.match(DISCOUNT_PROMISE_REGEX);
  if (discountMatch) {
    const percentStr = discountMatch[1] || discountMatch[2] || discountMatch[3];
    const parsedPercent = Number.parseFloat(percentStr);
    if (isValidFiniteNumber(parsedPercent) && parsedPercent > 0) {
      if (!effectivePolicy.allowAutonomousDiscounts) {
        return {
          decision: 'REQUIRE_HUMAN',
          reasonCode: 'UNAUTHORIZED_DISCOUNT_CLAIM',
          message: `Generated text offered an autonomous discount of ${parsedPercent}%, which is disabled by workspace policy.`,
          effectiveDiscountPercentage: 0,
          requiresHumanReview: true,
        };
      }
      if (parsedPercent > effectivePolicy.maxDiscountPercentage) {
        return {
          decision: 'REQUIRE_HUMAN',
          reasonCode: 'DISCOUNT_EXCEEDS_LIMIT',
          message: `Generated discount of ${parsedPercent}% exceeds tenant maximum allowed cap of ${effectivePolicy.maxDiscountPercentage}%.`,
          effectiveDiscountPercentage: effectivePolicy.maxDiscountPercentage,
          requiresHumanReview: true,
        };
      }
    }
  }

  // 6. Price Grounding Check
  const PRICE_PATTERN = /(?:(?:₹|rs\.?|inr|\$|usd|eur|€)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?))|(?:([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr|\$|usd|eur|€))/gi;
  let priceMatch: RegExpExecArray | null;
  const knowledgeCorpus = (request.retrievedKnowledge || []).join(' ');
  const catalogPrices = new Set(
    (request.candidateCatalogItems || [])
      .filter((i) => !i.accountId || i.accountId === context.accountId)
      .map((i) => i.basePrice)
  );

  while ((priceMatch = PRICE_PATTERN.exec(text)) !== null) {
    const rawNum = priceMatch[1] || priceMatch[2];
    if (rawNum) {
      const numericVal = Number.parseFloat(rawNum.replace(/,/g, ''));
      if (isValidFiniteNumber(numericVal) && numericVal > 0) {
        const inKnowledge =
          knowledgeCorpus.includes(rawNum) ||
          knowledgeCorpus.includes(numericVal.toString()) ||
          knowledgeCorpus.includes(numericVal.toLocaleString());
        const inCatalog = catalogPrices.has(numericVal);

        if (!inKnowledge && !inCatalog) {
          return {
            decision: 'REQUIRE_HUMAN',
            reasonCode: 'PRICE_NOT_FOUND',
            message: `Generated response contains price quote (${priceMatch[0].trim()}) not grounded in verified knowledge or catalog data.`,
            requiresHumanReview: true,
          };
        }
      }
    }
  }

  return {
    decision: 'ALLOW',
    reasonCode: 'SAFE_CONVERSATIONAL_RESPONSE',
    message: 'Generated response passed all safety and policy boundary checks.',
    requiresHumanReview: false,
  };
}

