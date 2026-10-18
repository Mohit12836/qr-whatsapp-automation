import {
  AgentConfiguration,
  AgentExecutionContext,
  AgentRunResult,
  ToolExecutionRecord,
} from './types';
import { AgentToolRegistry } from './tool-registry';

export class AgentRuntimeEngine {
  /**
   * Evaluates and executes an autonomous agent run against an incoming customer message.
   */
  static async executeTurn(
    incomingMessage: string,
    context: AgentExecutionContext
  ): Promise<AgentRunResult> {
    const { agentConfig } = context;

    // 1. Budget and Active Guard
    if (!agentConfig.isActive) {
      return {
        agentId: agentConfig.id,
        responseText: 'Agent is currently deactivated by administrator policy.',
        confidenceScore: 0,
        toolExecutions: [],
        requiresHumanReview: true,
        approvalReason: 'Agent deactivated',
      };
    }

    if (agentConfig.currentMonthlySpend >= agentConfig.maxMonthlyBudget) {
      return {
        agentId: agentConfig.id,
        responseText: 'नमस्कार जी, हमारा सिस्टम अभी अपडेट हो रहा है। हमारे प्रतिनिधि शीघ्र संपर्क करेंगे।',
        confidenceScore: 0.5,
        toolExecutions: [],
        requiresHumanReview: true,
        approvalReason: 'Monthly operational budget reached',
      };
    }

    // 2. Low-Initiative Intent Evaluation
    const lower = incomingMessage.toLowerCase();
    const toolExecutions: ToolExecutionRecord[] = [];
    let requiresHumanReview = false;
    let approvalReason: string | undefined;
    let responseText = '';
    let confidenceScore = 0.92;

    // 3. Execution logic based on agent category and intent
    if (
      lower.includes('rate') ||
      lower.includes('रेट') ||
      lower.includes('कीमत') ||
      lower.includes('खर्चा') ||
      lower.includes('price') ||
      lower.includes('पैसा')
    ) {
      // Intent: Price Enquiry
      if (agentConfig.allowedTools.includes('calculate_quote') && agentConfig.allowedTools.includes('search_catalog')) {
        const catalogTool = AgentToolRegistry.get('search_catalog');
        const quoteTool = AgentToolRegistry.get('calculate_quote');

        if (catalogTool && quoteTool) {
          const catalogResult = await catalogTool.execute({ query: 'ai' }, context);
          const quoteResult = await quoteTool.execute(
            { basePrice: catalogResult[0]?.basePrice || 2999, discountPercent: 10 },
            context
          );

          toolExecutions.push({
            toolName: 'search_catalog',
            input: { query: 'ai' },
            output: catalogResult,
            status: 'executed',
          });

          toolExecutions.push({
            toolName: 'calculate_quote',
            input: { basePrice: 2999, discountPercent: 10 },
            output: quoteResult,
            status: 'executed',
          });

          responseText = `राम-राम भैया जी! 🙏 हमारी सेवा का सामान्य मूल्य ₹${quoteResult.originalPrice} है, लेकिन वर्तमान ऑफर में यह आपको ₹${quoteResult.finalQuotedPrice} में पूरी तरह सेटअप करके मिलेगी। एक बार बता दीजिए आपकी दुकान रिटेल है या थोक?`;
        }
      } else {
        // Tool not allowed for this agent (e.g. Receptionist trying to quote)
        toolExecutions.push({
          toolName: 'calculate_quote',
          input: {},
          status: 'blocked_permission',
          error: 'Agent is not permitted to calculate quotes or disclose custom rates.',
        });
        responseText = 'नमस्कार जी! 🙏 मूल्य व कोटेशन की सटीक जानकारी के लिए मैं आपको हमारे सेल्स विशेषज्ञ से जोड़ रहा हूँ।';
        requiresHumanReview = true;
        approvalReason = 'Unauthorized rate disclosure requested';
      }
    } else if (lower.includes('इंसान') || lower.includes('बात करो') || lower.includes('शिकायत') || lower.includes('human')) {
      // Intent: Human Hand-off Request
      const escalateTool = AgentToolRegistry.get('escalate_to_human');
      if (escalateTool && agentConfig.allowedTools.includes('escalate_to_human')) {
        await escalateTool.execute({ reason: 'Customer requested human agent' }, context);
        toolExecutions.push({
          toolName: 'escalate_to_human',
          input: { reason: 'Customer requested human agent' },
          status: 'executed',
        });
      }
      responseText = 'जी बिल्कुल भैया जी, मैं आपकी चैट हमारे वरिष्ठ सहयोगी को सौंप रहा हूँ। वे 5 मिनट के भीतर आपसे यहीं बात करेंगे।';
      requiresHumanReview = true;
      approvalReason = 'Direct human assistance requested';
      confidenceScore = 0.99;
    } else {
      // Default: Low-Initiative Helpful Response (Silent CRM capture)
      const memoryTool = AgentToolRegistry.get('update_customer_facts');
      if (memoryTool && agentConfig.allowedTools.includes('update_customer_facts')) {
        await memoryTool.execute({ lastInteraction: incomingMessage, category: 'general_query' }, context);
        toolExecutions.push({
          toolName: 'update_customer_facts',
          input: { lastInteraction: incomingMessage },
          status: 'executed',
        });
      }

      responseText = `राम-राम भैया जी! 🙏 मैंने आपका संदेश प्राप्त कर लिया है: "${incomingMessage}"। आपकी आवश्यकता अनुसार हम आपकी पूरी मदद करेंगे। कृपया अपनी आवश्यकता थोड़ा विस्तार से बताएँ।`;
    }

    // 4. Autonomy Level Gating
    if (agentConfig.autonomyLevel === 'approval_required') {
      requiresHumanReview = true;
      approvalReason = approvalReason || 'Agent is configured with strict human approval required for all responses';
    }

    return {
      agentId: agentConfig.id,
      responseText,
      confidenceScore,
      toolExecutions,
      requiresHumanReview,
      approvalReason,
    };
  }
}
