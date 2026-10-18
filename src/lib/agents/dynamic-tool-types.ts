export type DynamicToolType = 
  | 'webhook_api' 
  | 'price_calculator' 
  | 'payment_link' 
  | 'knowledge_lookup' 
  | 'human_escalate' 
  | 'mcp_action';

export interface DynamicToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

export interface WebhookToolConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  bodyTemplate?: string; // e.g. '{"phone": "{{phone}}", "sku": "{{sku}}"}'
  responseExtractPath?: string; // e.g. 'data.result'
}

export interface CalculatorToolConfig {
  baseFormula: string; // e.g. 'qty * unitPrice * (1 + gstPercent / 100)'
  defaultGstPercent: number;
  maxDiscountPercent: number;
}

export interface PaymentToolConfig {
  gateway: 'razorpay' | 'upi_qr';
  maxAutonomousAmount: number;
  expiryMinutes: number;
}

export interface DynamicToolDefinition {
  id: string;
  accountId?: string;
  name: string; // Identifier e.g. 'check_inventory_stock'
  displayName: string; // Human title e.g. 'Check Inventory Stock API'
  description: string; // LLM prompt instruction e.g. 'Calls ERP to check available units for a given SKU'
  type: DynamicToolType;
  parameters: DynamicToolParameter[];
  config: WebhookToolConfig | CalculatorToolConfig | PaymentToolConfig | Record<string, unknown>;
  requiresApproval: boolean;
  maxAmountLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicAgentDefinition {
  id: string;
  accountId?: string;
  name: string;
  role: string;
  persona: string;
  systemPrompt: string;
  enabledToolIds: string[]; // List of dynamic tool IDs assigned to this agent
  autonomyLevel: 'auto' | 'guarded' | 'approval_required';
  triggerCondition: string; // e.g. 'on_customer_message' or 'on_price_inquiry'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
