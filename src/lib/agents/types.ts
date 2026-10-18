/**
 * Vismart Autonomous AI Agent Factory & Tool Registry Types
 *
 * Allows businesses to define, configure, and run specialized AI agents dynamically
 * from the dashboard with strict per-agent tool scoping, permission gates, and human handoff.
 */

export type AutonomyLevel = 'auto' | 'guarded' | 'approval_required' | 'blocked';
export type ToolRiskLevel = 'read_only' | 'low' | 'medium' | 'high_impact';

export interface AgentToolDefinition {
  name: string;
  description: string;
  category: 'crm' | 'messaging' | 'commerce' | 'intelligence' | 'admin';
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
  execute: (params: Record<string, any>, context: AgentExecutionContext) => Promise<any>;
}

export interface AgentConfiguration {
  id: string;
  tenantId: string;
  name: string;
  role: string;
  category: 'receptionist' | 'sales' | 'qualifier' | 'support' | 'followup' | 'analyst' | 'marketing' | 'custom';
  systemPrompt: string;
  temperature: number;
  allowedTools: string[]; // List of tool names this agent is authorized to use
  knowledgeBaseIds?: string[];
  confidenceThreshold: number; // e.g. 0.85 — below this, escalates to human
  autonomyLevel: AutonomyLevel;
  maxMonthlyBudget: number; // in INR
  currentMonthlySpend: number;
  isActive: boolean;
}

export interface AgentExecutionContext {
  tenantId: string;
  customerPhone: string;
  customerName?: string;
  conversationId?: string;
  messageHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  agentConfig: AgentConfiguration;
}

export interface ToolExecutionRecord {
  toolName: string;
  input: Record<string, any>;
  output?: any;
  status: 'executed' | 'blocked_permission' | 'queued_approval' | 'failed';
  error?: string;
}

export interface AgentRunResult {
  agentId: string;
  responseText: string;
  confidenceScore: number;
  toolExecutions: ToolExecutionRecord[];
  requiresHumanReview: boolean;
  approvalReason?: string;
  silentCrmUpdates?: Record<string, any>;
}
