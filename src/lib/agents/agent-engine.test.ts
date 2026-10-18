import { describe, it, expect } from 'vitest';
import { AgentRuntimeEngine } from './runtime-engine';
import { AgentConfiguration, AgentExecutionContext } from './types';

describe('Vismart Autonomous Agent Factory & Tool Engine', () => {
  const baseSalesConfig: AgentConfiguration = {
    id: 'agent-sales-01',
    tenantId: 'tenant-100',
    name: 'Smart Munim Closer',
    role: 'Autonomous Sales Closer',
    category: 'sales',
    systemPrompt: 'You are Smart Munim. Be polite, humble, and close deals within policy.',
    temperature: 0.3,
    allowedTools: ['search_catalog', 'calculate_quote', 'update_customer_facts', 'escalate_to_human'],
    confidenceThreshold: 0.85,
    autonomyLevel: 'auto',
    maxMonthlyBudget: 15000,
    currentMonthlySpend: 1200,
    isActive: true,
  };

  const baseReceptionistConfig: AgentConfiguration = {
    id: 'agent-receptionist-01',
    tenantId: 'tenant-100',
    name: 'Frontdesk AI',
    role: 'Welcome and routing receptionist',
    category: 'receptionist',
    systemPrompt: 'Welcome customers politely. Never quote prices or discounts.',
    temperature: 0.2,
    allowedTools: ['update_customer_facts', 'escalate_to_human'], // NOT allowed to quote
    confidenceThreshold: 0.9,
    autonomyLevel: 'auto',
    maxMonthlyBudget: 5000,
    currentMonthlySpend: 200,
    isActive: true,
  };

  it('allows authorized Sales Closer agent to search catalog and calculate quote', async () => {
    const context: AgentExecutionContext = {
      tenantId: 'tenant-100',
      customerPhone: '919826012345',
      customerName: 'राजेश पाटीदार',
      messageHistory: [],
      agentConfig: baseSalesConfig,
    };

    const result = await AgentRuntimeEngine.executeTurn('भैया जी क्या रेट है?', context);

    expect(result.agentId).toBe('agent-sales-01');
    expect(result.responseText).toContain('₹4499'); // 4999 - 10%
    expect(result.requiresHumanReview).toBe(false);

    const executedTools = result.toolExecutions.map((t) => t.toolName);
    expect(executedTools).toContain('search_catalog');
    expect(executedTools).toContain('calculate_quote');
    expect(result.toolExecutions.every((t) => t.status === 'executed')).toBe(true);
  });

  it('strictly blocks unauthorized tools and escalates if Receptionist tries to quote price', async () => {
    const context: AgentExecutionContext = {
      tenantId: 'tenant-100',
      customerPhone: '919826012345',
      customerName: 'राजेश पाटीदार',
      messageHistory: [],
      agentConfig: baseReceptionistConfig,
    };

    const result = await AgentRuntimeEngine.executeTurn('भैया जी क्या रेट है?', context);

    expect(result.agentId).toBe('agent-receptionist-01');
    expect(result.requiresHumanReview).toBe(true);
    expect(result.approvalReason).toContain('Unauthorized rate disclosure');

    const blockedExecution = result.toolExecutions.find((t) => t.toolName === 'calculate_quote');
    expect(blockedExecution).toBeDefined();
    expect(blockedExecution?.status).toBe('blocked_permission');
  });

  it('handles human escalation when customer requests human assistance', async () => {
    const context: AgentExecutionContext = {
      tenantId: 'tenant-100',
      customerPhone: '919826012345',
      messageHistory: [],
      agentConfig: baseSalesConfig,
    };

    const result = await AgentRuntimeEngine.executeTurn('मुझे किसी इंसान से बात करनी है', context);

    expect(result.requiresHumanReview).toBe(true);
    expect(result.approvalReason).toContain('Direct human assistance requested');
    expect(result.toolExecutions.some((t) => t.toolName === 'escalate_to_human')).toBe(true);
  });

  it('forces human review when agent autonomyLevel is set to approval_required', async () => {
    const guardedConfig: AgentConfiguration = {
      ...baseSalesConfig,
      autonomyLevel: 'approval_required',
    };

    const context: AgentExecutionContext = {
      tenantId: 'tenant-100',
      customerPhone: '919826012345',
      messageHistory: [],
      agentConfig: guardedConfig,
    };

    const result = await AgentRuntimeEngine.executeTurn('दुकान के लिए क्या सुविधा है?', context);

    expect(result.requiresHumanReview).toBe(true);
    expect(result.approvalReason).toContain('strict human approval');
  });

  it('halts execution when agent is deactivated by administrator', async () => {
    const deactivatedConfig: AgentConfiguration = {
      ...baseSalesConfig,
      isActive: false,
    };

    const context: AgentExecutionContext = {
      tenantId: 'tenant-100',
      customerPhone: '919826012345',
      messageHistory: [],
      agentConfig: deactivatedConfig,
    };

    const result = await AgentRuntimeEngine.executeTurn('हेलो भैया', context);

    expect(result.confidenceScore).toBe(0);
    expect(result.requiresHumanReview).toBe(true);
    expect(result.approvalReason).toBe('Agent deactivated');
  });
});
