import {
  DynamicToolDefinition,
  DynamicAgentDefinition,
} from './dynamic-tool-types';
import { DynamicToolExecutor, DynamicToolExecutionResult } from './dynamic-tool-executor';

export class DynamicAgentRegistry {
  private tools: Map<string, DynamicToolDefinition> = new Map();
  private agents: Map<string, DynamicAgentDefinition> = new Map();
  private executor: DynamicToolExecutor;

  constructor(executor?: DynamicToolExecutor) {
    this.executor = executor || new DynamicToolExecutor();
    this.seedDefaultDynamicTools();
  }

  // -------------------------------------------------------------
  // Tool Management
  // -------------------------------------------------------------
  public registerTool(tool: Omit<DynamicToolDefinition, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): DynamicToolDefinition {
    const id = tool.id || `tool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fullTool: DynamicToolDefinition = {
      ...tool,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tools.set(id, fullTool);
    return fullTool;
  }

  public getTools(accountId?: string): DynamicToolDefinition[] {
    const all = Array.from(this.tools.values());
    if (!accountId) return all;
    return all.filter(t => !t.accountId || t.accountId === accountId);
  }

  public getTool(id: string): DynamicToolDefinition | undefined {
    return this.tools.get(id);
  }

  public deleteTool(id: string): boolean {
    return this.tools.delete(id);
  }

  // -------------------------------------------------------------
  // Agent Management
  // -------------------------------------------------------------
  public registerAgent(agent: Omit<DynamicAgentDefinition, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): DynamicAgentDefinition {
    const id = agent.id || `dyn_agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fullAgent: DynamicAgentDefinition = {
      ...agent,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.agents.set(id, fullAgent);
    return fullAgent;
  }

  public getAgents(accountId?: string): DynamicAgentDefinition[] {
    const all = Array.from(this.agents.values());
    if (!accountId) return all;
    return all.filter(a => !a.accountId || a.accountId === accountId);
  }

  public getAgent(id: string): DynamicAgentDefinition | undefined {
    return this.agents.get(id);
  }

  public deleteAgent(id: string): boolean {
    return this.agents.delete(id);
  }

  public getToolsForAgent(agentId: string): DynamicToolDefinition[] {
    const agent = this.agents.get(agentId);
    if (!agent) return [];
    return agent.enabledToolIds
      .map(tid => this.tools.get(tid))
      .filter((t): t is DynamicToolDefinition => !!t);
  }

  // -------------------------------------------------------------
  // LLM Schema Export (Function Calling Schemas)
  // -------------------------------------------------------------
  public exportLLMToolSchemas(agentId: string): Array<{
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  }> {
    const tools = this.getToolsForAgent(agentId);
    return tools.map(t => {
      const properties: Record<string, { type: string; description: string }> = {};
      const required: string[] = [];

      t.parameters.forEach(p => {
        properties[p.name] = {
          type: p.type,
          description: p.description,
        };
        if (p.required) {
          required.push(p.name);
        }
      });

      return {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
      };
    });
  }

  // -------------------------------------------------------------
  // Dynamic Execution
  // -------------------------------------------------------------
  public async executeAgentTool(
    agentId: string,
    toolName: string,
    params: Record<string, unknown>,
    context?: { contactPhone?: string; contactName?: string }
  ): Promise<DynamicToolExecutionResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, toolName, status: 'failed', error: `Agent '${agentId}' not found.` };
    }

    const availableTools = this.getToolsForAgent(agentId);
    const targetTool = availableTools.find(t => t.name === toolName);

    if (!targetTool) {
      return {
        success: false,
        toolName,
        status: 'failed',
        error: `Permission Denied: Tool '${toolName}' is not assigned to agent '${agent.name}'. Check agent settings in dashboard.`,
      };
    }

    return this.executor.executeTool(targetTool, params, {
      ...context,
      agentAutonomy: agent.autonomyLevel,
    });
  }

  // -------------------------------------------------------------
  // Built-in Defaults (Ready out-of-the-box for Dashboard)
  // -------------------------------------------------------------
  private seedDefaultDynamicTools(): void {
    this.registerTool({
      id: 'tool_quote_calc',
      name: 'calculate_custom_quote',
      displayName: 'GST Quotation Calculator',
      description: 'Calculates quotation subtotal, applied discount, 18% GST, and grand total',
      type: 'price_calculator',
      parameters: [
        { name: 'qty', type: 'number', description: 'Quantity of items', required: true },
        { name: 'unitPrice', type: 'number', description: 'Price per unit in INR', required: true },
        { name: 'discountPercent', type: 'number', description: 'Discount percentage (0-15)', required: false },
      ],
      config: {
        baseFormula: 'qty * unitPrice',
        defaultGstPercent: 18,
        maxDiscountPercent: 15,
      },
      requiresApproval: false,
    });

    this.registerTool({
      id: 'tool_upi_payment',
      name: 'generate_upi_link',
      displayName: 'Instant UPI / Razorpay Link Generator',
      description: 'Generates an instant UPI payment intent link for the customer',
      type: 'payment_link',
      parameters: [
        { name: 'amount', type: 'number', description: 'Payment amount in INR', required: true },
        { name: 'description', type: 'string', description: 'Order purpose or invoice note', required: true },
      ],
      config: {
        gateway: 'upi_qr',
        maxAutonomousAmount: 10000,
        expiryMinutes: 60,
      },
      requiresApproval: false,
    });

    this.registerTool({
      id: 'tool_human_alert',
      name: 'alert_human_executive',
      displayName: 'Escalate to Human Executive',
      description: 'Pauses AI agent and flags chat for urgent human manager takeover',
      type: 'human_escalate',
      parameters: [
        { name: 'reason', type: 'string', description: 'Reason for handoff', required: true },
      ],
      config: {},
      requiresApproval: false,
    });
  }
}
