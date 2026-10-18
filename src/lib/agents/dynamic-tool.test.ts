import { describe, it, expect, beforeEach } from 'vitest';
import { DynamicAgentRegistry } from './dynamic-agent-registry';

describe('Dynamic Agent & Tool Builder Engine', () => {
  let registry: DynamicAgentRegistry;

  beforeEach(() => {
    registry = new DynamicAgentRegistry();
  });

  it('allows registering a new dynamic tool on the fly (e.g. from Dashboard)', () => {
    const customTool = registry.registerTool({
      name: 'check_stock_erp',
      displayName: 'ERP Stock Check API',
      description: 'Queries ERP to check available quantity for a product SKU',
      type: 'webhook_api',
      parameters: [
        { name: 'sku', type: 'string', description: 'Product item code', required: true },
      ],
      config: {
        url: 'https://test-api.example.com/stock?sku={{sku}}',
        method: 'GET',
      },
      requiresApproval: false,
    });

    expect(customTool.id).toBeDefined();
    expect(registry.getTool(customTool.id)?.name).toBe('check_stock_erp');
  });

  it('allows creating a custom agent and assigning custom tools with permission gating', async () => {
    // 1. Create a dynamic agent from dashboard
    const agent = registry.registerAgent({
      name: 'Textile Wholesale Closer',
      role: 'Negotiate bulk fabric orders and issue quotations',
      persona: 'Hinglish Textile Consultant',
      systemPrompt: 'Help buyers calculate yardage and get instant GST quotes.',
      enabledToolIds: ['tool_quote_calc'], // Only quotation tool allowed, no payment tool!
      autonomyLevel: 'auto',
      triggerCondition: 'on_inquiry',
      isActive: true,
    });

    // 2. Export schemas for LLM
    const schemas = registry.exportLLMToolSchemas(agent.id);
    expect(schemas.length).toBe(1);
    expect(schemas[0].name).toBe('calculate_custom_quote');

    // 3. Allowed tool execution succeeds
    const execResult = await registry.executeAgentTool(agent.id, 'calculate_custom_quote', {
      qty: 100,
      unitPrice: 50,
      discountPercent: 10,
    });
    expect(execResult.success).toBe(true);
    expect(execResult.status).toBe('executed');
    const data = execResult.result as { grandTotal: number; discountAmount: number };
    expect(data.discountAmount).toBe(500); // 5000 * 0.10 = 500
    expect(data.grandTotal).toBe(5310); // 4500 + 18% GST (810) = 5310

    // 4. Unassigned tool execution is blocked by safety gate!
    const blockedResult = await registry.executeAgentTool(agent.id, 'generate_upi_link', {
      amount: 5000,
      description: 'Advance',
    });
    expect(blockedResult.success).toBe(false);
    expect(blockedResult.error).toContain('Permission Denied');
  });

  it('halts with approval_required when safety policy or autonomy level mandates review', async () => {
    // Register guarded tool
    const sensitiveTool = registry.registerTool({
      name: 'send_exclusive_discount',
      displayName: 'VIP Discount Voucher',
      description: 'Grants high discount up to 25%',
      type: 'price_calculator',
      parameters: [{ name: 'qty', type: 'number', description: 'Qty', required: true }],
      config: { baseFormula: 'qty * 100', defaultGstPercent: 18, maxDiscountPercent: 25 },
      requiresApproval: true, // Marked dangerous!
    });

    const guardedAgent = registry.registerAgent({
      name: 'Guarded Junior Rep',
      role: 'Junior sales assistant',
      persona: 'Polite',
      systemPrompt: 'Assist customers',
      enabledToolIds: [sensitiveTool.id],
      autonomyLevel: 'auto',
      triggerCondition: 'on_inquiry',
      isActive: true,
    });

    const result = await registry.executeAgentTool(guardedAgent.id, 'send_exclusive_discount', { qty: 2 });
    expect(result.success).toBe(false);
    expect(result.status).toBe('approval_required');
    expect(result.approvalReason).toContain('requires human review');
  });

  it('interpolates variables dynamically in webhook tools', async () => {
    const webhookTool = registry.registerTool({
      name: 'notify_external_crm',
      displayName: 'External CRM Sync',
      description: 'Syncs customer interest to external CRM',
      type: 'webhook_api',
      parameters: [{ name: 'dealSize', type: 'number', description: 'Deal size', required: true }],
      config: {
        url: 'https://test-api.example.com/lead',
        method: 'POST',
        bodyTemplate: '{"phone":"{{phone}}","leadVal":"{{dealSize}}"}',
      },
      requiresApproval: false,
    });

    const crmAgent = registry.registerAgent({
      name: 'CRM Sync Bot',
      role: 'Sync leads',
      persona: 'Robot',
      systemPrompt: 'Sync',
      enabledToolIds: [webhookTool.id],
      autonomyLevel: 'auto',
      triggerCondition: 'on_deal',
      isActive: true,
    });

    const result = await registry.executeAgentTool(
      crmAgent.id,
      'notify_external_crm',
      { dealSize: 50000 },
      { contactPhone: '919876543210' }
    );

    expect(result.success).toBe(true);
    const resData = result.result as { dispatchedPayload: { phone: string; leadVal: string } };
    expect(resData.dispatchedPayload.phone).toBe('919876543210');
    expect(resData.dispatchedPayload.leadVal).toBe('50000');
  });
});
