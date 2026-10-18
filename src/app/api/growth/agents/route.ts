import { NextRequest, NextResponse } from 'next/server';
import { AgentRuntimeEngine } from '@/lib/agents/runtime-engine';
import { AgentConfiguration, AgentExecutionContext } from '@/lib/agents/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, customerPhone, customerName, agentConfig } = body;

    if (!message || !customerPhone) {
      return NextResponse.json({ error: 'message and customerPhone required' }, { status: 400 });
    }

    const defaultSalesConfig: AgentConfiguration = {
      id: 'agent-munim-default',
      tenantId: 'tenant-default',
      name: 'Smart Munim Closer',
      role: 'Autonomous Sales Closer',
      category: 'sales',
      systemPrompt: 'Be humble, polite, and close deals within policy.',
      temperature: 0.3,
      allowedTools: ['search_catalog', 'calculate_quote', 'update_customer_facts', 'escalate_to_human'],
      confidenceThreshold: 0.85,
      autonomyLevel: 'auto',
      maxMonthlyBudget: 15000,
      currentMonthlySpend: 0,
      isActive: true,
    };

    const effectiveConfig = agentConfig || defaultSalesConfig;

    const context: AgentExecutionContext = {
      tenantId: effectiveConfig.tenantId,
      customerPhone,
      customerName: customerName || 'व्यापारी भाई',
      messageHistory: [],
      agentConfig: effectiveConfig,
    };

    const result = await AgentRuntimeEngine.executeTurn(message, context);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Agent execution failed' },
      { status: 500 }
    );
  }
}
