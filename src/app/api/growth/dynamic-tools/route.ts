import { NextRequest, NextResponse } from 'next/server';
import { DynamicAgentRegistry } from '@/lib/agents/dynamic-agent-registry';

// Global singleton instance for dynamic agents and tools
const globalRegistry = new DynamicAgentRegistry();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId') || undefined;
  const agentId = searchParams.get('agentId');

  if (agentId) {
    const agent = globalRegistry.getAgent(agentId);
    const tools = globalRegistry.getToolsForAgent(agentId);
    const schemas = globalRegistry.exportLLMToolSchemas(agentId);
    return NextResponse.json({ success: true, data: { agent, tools, schemas } });
  }

  return NextResponse.json({
    success: true,
    data: {
      tools: globalRegistry.getTools(accountId),
      agents: globalRegistry.getAgents(accountId),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Create / Register Tool from Dashboard
    if (action === 'create_tool') {
      const tool = globalRegistry.registerTool(body.tool);
      return NextResponse.json({ success: true, data: tool });
    }

    // 2. Delete Tool
    if (action === 'delete_tool') {
      const deleted = globalRegistry.deleteTool(body.id);
      return NextResponse.json({ success: deleted });
    }

    // 3. Create / Register Agent from Dashboard
    if (action === 'create_agent') {
      const agent = globalRegistry.registerAgent(body.agent);
      return NextResponse.json({ success: true, data: agent });
    }

    // 4. Delete Agent
    if (action === 'delete_agent') {
      const deleted = globalRegistry.deleteAgent(body.id);
      return NextResponse.json({ success: deleted });
    }

    // 5. Test Execute Agent Tool
    if (action === 'execute_tool') {
      const result = await globalRegistry.executeAgentTool(
        body.agentId,
        body.toolName,
        body.params || {},
        body.context
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
