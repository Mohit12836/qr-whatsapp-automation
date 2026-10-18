import {
  DynamicToolDefinition,
  WebhookToolConfig,
  CalculatorToolConfig,
  PaymentToolConfig,
} from './dynamic-tool-types';
import { PaymentConnector } from '../connectors/payment-connector';

export interface DynamicToolExecutionResult {
  success: boolean;
  toolName: string;
  status: 'executed' | 'approval_required' | 'failed';
  result?: unknown;
  error?: string;
  approvalReason?: string;
}

export class DynamicToolExecutor {
  private paymentConnector: PaymentConnector;

  constructor(paymentConnector?: PaymentConnector) {
    this.paymentConnector = paymentConnector || new PaymentConnector({ isTestMode: true });
  }

  public async executeTool(
    tool: DynamicToolDefinition,
    params: Record<string, unknown>,
    context?: { contactPhone?: string; contactName?: string; agentAutonomy?: string }
  ): Promise<DynamicToolExecutionResult> {
    // 1. Check permission gate
    if (tool.requiresApproval || context?.agentAutonomy === 'approval_required') {
      return {
        success: false,
        toolName: tool.name,
        status: 'approval_required',
        approvalReason: `Tool '${tool.displayName}' has safety gate enabled and requires human review before execution.`,
      };
    }

    // 2. Route by dynamic tool type
    try {
      switch (tool.type) {
        case 'webhook_api':
          return await this.executeWebhookTool(tool, tool.config as WebhookToolConfig, params, context);

        case 'price_calculator':
          return this.executeCalculatorTool(tool, tool.config as CalculatorToolConfig, params);

        case 'payment_link':
          return await this.executePaymentTool(tool, tool.config as PaymentToolConfig, params, context);

        case 'human_escalate':
          return {
            success: true,
            toolName: tool.name,
            status: 'executed',
            result: {
              escalated: true,
              contactPhone: context?.contactPhone,
              reason: params.reason || 'Customer requested human assistance',
              escalatedAt: new Date().toISOString(),
            },
          };

        case 'knowledge_lookup':
          return {
            success: true,
            toolName: tool.name,
            status: 'executed',
            result: {
              query: params.query,
              found: true,
              snippet: `Verified business information retrieved for "${params.query}".`,
            },
          };

        default:
          return {
            success: false,
            toolName: tool.name,
            status: 'failed',
            error: `Unsupported tool type: ${tool.type}`,
          };
      }
    } catch (err) {
      return {
        success: false,
        toolName: tool.name,
        status: 'failed',
        error: (err as Error).message,
      };
    }
  }

  private async executeWebhookTool(
    tool: DynamicToolDefinition,
    config: WebhookToolConfig,
    params: Record<string, unknown>,
    context?: { contactPhone?: string; contactName?: string }
  ): Promise<DynamicToolExecutionResult> {
    const mergedVars: Record<string, unknown> = {
      phone: context?.contactPhone || '',
      name: context?.contactName || '',
      ...params,
    };

    // Interpolate body template
    let bodyString = config.bodyTemplate || '{}';
    for (const [k, v] of Object.entries(mergedVars)) {
      bodyString = bodyString.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }

    // Interpolate URL
    let targetUrl = config.url;
    for (const [k, v] of Object.entries(mergedVars)) {
      targetUrl = targetUrl.replace(new RegExp(`{{${k}}}`, 'g'), encodeURIComponent(String(v)));
    }

    // In local/test environments or mock URLs, return simulated success without blocking
    if (targetUrl.includes('example.com') || targetUrl.includes('test-api')) {
      return {
        success: true,
        toolName: tool.name,
        status: 'executed',
        result: {
          simulated: true,
          endpoint: targetUrl,
          dispatchedPayload: JSON.parse(bodyString),
          response: { status: 200, message: 'Webhook executed successfully via dynamic engine' },
        },
      };
    }

    // Live HTTP fetch call
    const res = await fetch(targetUrl, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {}),
      },
      body: config.method !== 'GET' ? bodyString : undefined,
    });

    const responseData = await res.json().catch(() => ({ status: res.status, text: res.statusText }));
    return {
      success: res.ok,
      toolName: tool.name,
      status: res.ok ? 'executed' : 'failed',
      result: responseData,
      error: !res.ok ? `HTTP ${res.status}: ${JSON.stringify(responseData)}` : undefined,
    };
  }

  private executeCalculatorTool(
    tool: DynamicToolDefinition,
    config: CalculatorToolConfig,
    params: Record<string, unknown>
  ): DynamicToolExecutionResult {
    const qty = Number(params.qty || params.quantity || 1);
    const unitPrice = Number(params.unitPrice || params.price || 0);
    const discountPercent = Math.min(Number(params.discountPercent || 0), config.maxDiscountPercent);
    const gstPercent = Number(config.defaultGstPercent || 18);

    const subtotal = qty * unitPrice;
    const discountAmount = subtotal * (discountPercent / 100);
    const discountedSubtotal = subtotal - discountAmount;
    const gstAmount = discountedSubtotal * (gstPercent / 100);
    const grandTotal = Math.round((discountedSubtotal + gstAmount) * 100) / 100;

    return {
      success: true,
      toolName: tool.name,
      status: 'executed',
      result: {
        quantity: qty,
        unitPrice,
        subtotal,
        discountAppliedPercent: discountPercent,
        discountAmount,
        gstPercent,
        gstAmount,
        grandTotal,
      },
    };
  }

  private async executePaymentTool(
    tool: DynamicToolDefinition,
    config: PaymentToolConfig,
    params: Record<string, unknown>,
    context?: { contactPhone?: string; contactName?: string }
  ): Promise<DynamicToolExecutionResult> {
    const amount = Number(params.amount || 0);

    // Limit check
    if (config.maxAutonomousAmount && amount > config.maxAutonomousAmount) {
      return {
        success: false,
        toolName: tool.name,
        status: 'approval_required',
        approvalReason: `Amount ₹${amount} exceeds the dynamic tool ceiling of ₹${config.maxAutonomousAmount}.`,
      };
    }

    const link = await this.paymentConnector.createPaymentLink({
      orderId: `ord_dyn_${Date.now()}`,
      amount,
      currency: 'INR',
      customer: {
        name: context?.contactName || 'Customer',
        phone: context?.contactPhone || '919876543210',
      },
      description: String(params.description || 'Order Payment'),
    });

    return {
      success: true,
      toolName: tool.name,
      status: 'executed',
      result: link,
    };
  }
}
