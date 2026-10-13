import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AiConfig } from './types'

// Shared, hoisted mock state so the module mocks can close over it.
const h = vi.hoisted(() => ({
  loadAiConfig: vi.fn(),
  buildConversationContext: vi.fn(),
  retrieveKnowledge: vi.fn(),
  generateReply: vi.fn(),
  engineSendText: vi.fn(),
  loadAccountMetaCredentials: vi.fn(),
  sendTypingIndicator: vi.fn(),
  loadTenantPolicyResult: vi.fn(),
  evaluateActionPolicy: vi.fn(),
  evaluateGeneratedResponseSafety: vi.fn(),
  state: {
    conv: null as Record<string, unknown> | null,
    autoResponders: [] as { id: string }[],
    claim: true as boolean,
    updatePayload: null as Record<string, unknown> | null,
    updateCalls: 0 as number,
    updateError: null as unknown,
    updateThrows: null as string | null,
    rpcCalls: [] as { name: string; args: unknown }[],
  },
}))

vi.mock('./config', () => ({ loadAiConfig: h.loadAiConfig }))
vi.mock('./context', () => ({ buildConversationContext: h.buildConversationContext }))
vi.mock('./knowledge', () => ({ retrieveKnowledge: h.retrieveKnowledge }))
vi.mock('./generate', () => ({ generateReply: h.generateReply }))
vi.mock('./policy-service', () => ({ loadTenantPolicyResult: h.loadTenantPolicyResult }))
vi.mock('./policy-guard', () => ({
  evaluateActionPolicy: h.evaluateActionPolicy,
  evaluateGeneratedResponseSafety: h.evaluateGeneratedResponseSafety,
}))
vi.mock('@/lib/flows/meta-send', () => ({
  engineSendText: h.engineSendText,
  loadAccountMetaCredentials: h.loadAccountMetaCredentials,
}))
vi.mock('@/lib/whatsapp/meta-api', () => ({
  sendTypingIndicator: h.sendTypingIndicator,
}))
vi.mock('./admin-client', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'automations') {
        // .select().eq().eq().in().limit() → active auto-responders
        const chain = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          limit: () =>
            Promise.resolve({ data: h.state.autoResponders, error: null }),
        }
        return chain
      }
      // conversations
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: h.state.conv, error: null }),
          }),
        }),
        update: (payload: Record<string, unknown>) => {
          h.state.updatePayload = payload
          h.state.updateCalls++
          if (h.state.updateThrows) {
            throw new Error(h.state.updateThrows)
          }
          return {
            eq: () => Promise.resolve({ error: h.state.updateError }),
          }
        },
      }
    },
    rpc: (name: string, args: unknown) => {
      h.state.rpcCalls.push({ name, args })
      return Promise.resolve({ data: h.state.claim, error: null })
    },
  }),
}))

import { dispatchInboundToAiReply } from './auto-reply'

const ARGS = {
  accountId: 'acct-1',
  conversationId: 'conv-1',
  contactId: 'contact-1',
  configOwnerUserId: 'user-1',
  inboundMessageId: 'wamid.inbound-1',
}

function aiConfig(overrides: Partial<AiConfig> = {}): AiConfig {
  return {
    provider: 'openai',
    model: 'gpt-test',
    apiKey: 'sk-test',
    systemPrompt: null,
    isActive: true,
    autoReplyEnabled: true,
    autoReplyMaxPerConversation: 3,
    handoffAgentId: null,
    embeddingsApiKey: null,
    ...overrides,
  }
}

beforeEach(() => {
  h.state.conv = {
    assigned_agent_id: null,
    ai_autoreply_disabled: false,
    ai_reply_count: 0,
  }
  h.state.autoResponders = []
  h.state.claim = true
  h.state.updatePayload = null
  h.state.updateCalls = 0
  h.state.updateError = null
  h.state.updateThrows = null
  h.state.rpcCalls = []
  h.loadAiConfig.mockResolvedValue(aiConfig())
  h.buildConversationContext.mockResolvedValue([{ role: 'user', content: 'hi' }])
  h.retrieveKnowledge.mockResolvedValue([])
  h.generateReply.mockResolvedValue({ text: 'Hello!', handoff: false })
  h.engineSendText.mockResolvedValue({ whatsapp_message_id: 'm1' })
  h.loadAccountMetaCredentials.mockResolvedValue({
    phoneNumberId: 'pn-1',
    accessToken: 'tok',
  })
  h.sendTypingIndicator.mockResolvedValue(undefined)

  // Policy Guard defaults: safe allow
  h.loadTenantPolicyResult.mockResolvedValue({
    success: true,
    policy: {
      accountId: 'acct-1',
      currency: 'INR',
      maxDiscountPercentage: 0.0,
      allowAutonomousDiscounts: false,
      allowAutonomousPaymentLinks: false,
      requireHumanApprovalForRefunds: true,
      version: 1,
    },
    isDefault: false,
  })
  h.evaluateActionPolicy.mockReturnValue({
    decision: 'ALLOW',
    reasonCode: 'DISCOUNT_ALLOWED',
    message: 'Safe read operation allowed.',
    requiresHumanReview: false,
  })
  h.evaluateGeneratedResponseSafety.mockReturnValue({
    decision: 'ALLOW',
    reasonCode: 'SAFE_CONVERSATIONAL_RESPONSE',
    message: 'Safe response',
    requiresHumanReview: false,
  })
})

describe('dispatchInboundToAiReply — eligibility gates', () => {
  it('claims a slot and sends on the happy path', async () => {
    await dispatchInboundToAiReply(ARGS)
    expect(h.state.rpcCalls).toEqual([
      {
        name: 'claim_ai_reply_slot',
        args: { conversation_id: 'conv-1', max_replies: 3 },
      },
    ])
    expect(h.engineSendText).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'conv-1', text: 'Hello!' }),
    )
  })

  it('grounds the reply in retrieved knowledge', async () => {
    h.retrieveKnowledge.mockResolvedValue(['Returns accepted within 30 days.'])
    await dispatchInboundToAiReply(ARGS)
    expect(h.retrieveKnowledge).toHaveBeenCalled()
    const systemPrompt = h.generateReply.mock.calls[0][0].systemPrompt as string
    expect(systemPrompt).toContain('Returns accepted within 30 days.')
  })

  it('stands down when an active message-level automation exists', async () => {
    h.state.autoResponders = [{ id: 'auto-1' }]
    await dispatchInboundToAiReply(ARGS)
    expect(h.generateReply).not.toHaveBeenCalled()
    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.sendTypingIndicator).not.toHaveBeenCalled()
  })

  it('does not send when the atomic slot claim loses the race', async () => {
    h.state.claim = false
    await dispatchInboundToAiReply(ARGS)
    // It still attempts the claim, but the send is skipped.
    expect(h.state.rpcCalls).toHaveLength(1)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when AI is off / not configured', async () => {
    h.loadAiConfig.mockResolvedValue(null)
    await dispatchInboundToAiReply(ARGS)
    expect(h.generateReply).not.toHaveBeenCalled()
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when auto-reply is disabled for the account', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ autoReplyEnabled: false }))
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when a human agent is assigned', async () => {
    h.state.conv = {
      assigned_agent_id: 'agent-9',
      ai_autoreply_disabled: false,
      ai_reply_count: 0,
    }
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.sendTypingIndicator).not.toHaveBeenCalled()
  })

  it('skips when auto-reply was disabled on this conversation', async () => {
    h.state.conv = {
      assigned_agent_id: null,
      ai_autoreply_disabled: true,
      ai_reply_count: 0,
    }
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when the per-conversation cap is reached', async () => {
    h.state.conv = {
      assigned_agent_id: null,
      ai_autoreply_disabled: false,
      ai_reply_count: 3,
    }
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
  })

  it('skips when there is nothing to reply to', async () => {
    h.buildConversationContext.mockResolvedValue([])
    await dispatchInboundToAiReply(ARGS)
    expect(h.generateReply).not.toHaveBeenCalled()
    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.sendTypingIndicator).not.toHaveBeenCalled()
  })
})

describe('dispatchInboundToAiReply — typing indicator (#527)', () => {
  it('shows "typing…" on the inbound wamid before calling the LLM', async () => {
    await dispatchInboundToAiReply(ARGS)
    expect(h.loadAccountMetaCredentials).toHaveBeenCalledWith(
      expect.anything(),
      'acct-1',
    )
    expect(h.sendTypingIndicator).toHaveBeenCalledTimes(1)
    expect(h.sendTypingIndicator).toHaveBeenCalledWith({
      phoneNumberId: 'pn-1',
      accessToken: 'tok',
      messageId: 'wamid.inbound-1',
    })
    // Ordering: the indicator goes out while the customer waits on the
    // model, not after the reply is already generated.
    const typingOrder = h.sendTypingIndicator.mock.invocationCallOrder[0]
    const llmOrder = h.generateReply.mock.invocationCallOrder[0]
    expect(typingOrder).toBeLessThan(llmOrder)
    expect(h.engineSendText).toHaveBeenCalledTimes(1)
  })

  it('still sends the reply when the indicator request fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    h.sendTypingIndicator.mockRejectedValue(new Error('Meta API error: 400'))
    await dispatchInboundToAiReply(ARGS)
    expect(h.generateReply).toHaveBeenCalledTimes(1)
    expect(h.engineSendText).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'conv-1', text: 'Hello!' }),
    )
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('typing indicator failed'),
      expect.any(Error),
    )
    warn.mockRestore()
  })

  it('still sends the reply when the WhatsApp credentials cannot be loaded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    h.loadAccountMetaCredentials.mockRejectedValue(
      new Error('WhatsApp not configured for this account'),
    )
    await dispatchInboundToAiReply(ARGS)
    expect(h.sendTypingIndicator).not.toHaveBeenCalled()
    expect(h.engineSendText).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('skips the indicator when no inbound wamid is supplied', async () => {
    const { inboundMessageId: _omit, ...legacyArgs } = ARGS
    void _omit
    await dispatchInboundToAiReply(legacyArgs)
    expect(h.sendTypingIndicator).not.toHaveBeenCalled()
    expect(h.loadAccountMetaCredentials).not.toHaveBeenCalled()
    expect(h.engineSendText).toHaveBeenCalledTimes(1)
  })

  it('does not fire when a gate short-circuits before the LLM', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ autoReplyEnabled: false }))
    await dispatchInboundToAiReply(ARGS)
    expect(h.sendTypingIndicator).not.toHaveBeenCalled()
    expect(h.loadAccountMetaCredentials).not.toHaveBeenCalled()
  })
})

describe('dispatchInboundToAiReply — handoff', () => {
  it('disables auto-reply, writes a summary, and does not send on handoff', async () => {
    h.generateReply.mockResolvedValue({ text: '', handoff: true })
    await dispatchInboundToAiReply(ARGS)
    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.state.rpcCalls).toHaveLength(0)
    expect(h.state.updatePayload).toMatchObject({ ai_autoreply_disabled: true })
    expect(h.state.updatePayload?.ai_handoff_summary).toContain(
      'AI agent handed off',
    )
    // No handoff target configured → conversation left unassigned.
    expect(h.state.updatePayload).not.toHaveProperty('assigned_agent_id')
  })

  it('routes to the configured handoff agent on handoff', async () => {
    h.loadAiConfig.mockResolvedValue(aiConfig({ handoffAgentId: 'agent-7' }))
    h.generateReply.mockResolvedValue({ text: '', handoff: true })
    await dispatchInboundToAiReply(ARGS)
    expect(h.state.updatePayload).toMatchObject({
      ai_autoreply_disabled: true,
      assigned_agent_id: 'agent-7',
    })
  })
})

describe('dispatchInboundToAiReply — Deterministic Policy Guard (P0.4B.2B.1)', () => {
  it('fails closed and blocks outbound send when policy database query errors', async () => {
    const errLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    h.loadTenantPolicyResult.mockResolvedValueOnce({
      success: false,
      error: 'DB connection timeout',
      errorCode: 'DB_ERROR',
      policy: null,
    })

    await dispatchInboundToAiReply(ARGS)

    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.state.rpcCalls).toHaveLength(0)
    expect(h.state.updatePayload).toMatchObject({
      ai_autoreply_disabled: true,
      ai_handoff_summary: expect.stringContaining('Policy Guard unavailable (DB_ERROR)'),
    })
    errLog.mockRestore()
  })

  it('blocks outbound send and hands off thread when policy evaluation requires human review', async () => {
    const warnLog = vi.spyOn(console, 'warn').mockImplementation(() => {})
    h.evaluateActionPolicy.mockReturnValueOnce({
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'HUMAN_APPROVAL_REQUIRED',
      message: 'Sensitive refund action requires human verification.',
      requiresHumanReview: true,
    })

    await dispatchInboundToAiReply(ARGS)

    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.state.rpcCalls).toHaveLength(0)
    expect(h.state.updatePayload).toMatchObject({
      ai_autoreply_disabled: true,
      ai_handoff_summary: expect.stringContaining('Policy Guard triggered handoff (HUMAN_APPROVAL_REQUIRED)'),
    })
    warnLog.mockRestore()
  })

  it('blocks outbound send and hands off when policy evaluation denies action', async () => {
    const warnLog = vi.spyOn(console, 'warn').mockImplementation(() => {})
    h.evaluateActionPolicy.mockReturnValueOnce({
      decision: 'DENY',
      reasonCode: 'UNAUTHORIZED_DESTRUCTIVE_ACTION',
      message: 'Action is permanently blocked.',
      requiresHumanReview: false,
    })

    await dispatchInboundToAiReply(ARGS)

    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.state.rpcCalls).toHaveLength(0)
    expect(h.state.updatePayload).toMatchObject({
      ai_autoreply_disabled: true,
      ai_handoff_summary: expect.stringContaining('Policy Guard triggered handoff (UNAUTHORIZED_DESTRUCTIVE_ACTION)'),
    })
    warnLog.mockRestore()
  })

  it('verifies trusted server context matches tenant accountId and userId', async () => {
    await dispatchInboundToAiReply(ARGS)

    expect(h.evaluateActionPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'acct-1',
        userId: 'user-1',
        source: 'whatsapp_inbound',
      }),
      expect.anything(),
      expect.anything(),
    )
  })

  it('blocks outbound send and hands off thread when generated response contains unauthorized discount claim', async () => {
    const warnLog = vi.spyOn(console, 'warn').mockImplementation(() => {})
    h.evaluateGeneratedResponseSafety.mockReturnValueOnce({
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'UNAUTHORIZED_DISCOUNT_CLAIM',
      message: 'Generated text offered an autonomous discount of 20%, which is disabled.',
      requiresHumanReview: true,
    })

    await dispatchInboundToAiReply(ARGS)

    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.state.rpcCalls).toHaveLength(0)
    expect(h.state.updatePayload).toMatchObject({
      ai_autoreply_disabled: true,
      ai_handoff_summary: expect.stringContaining('Response Safety Guard triggered handoff (UNAUTHORIZED_DISCOUNT_CLAIM)'),
    })
    warnLog.mockRestore()
  })

  it('blocks outbound send and hands off thread when generated response contains unverified price quote', async () => {
    const warnLog = vi.spyOn(console, 'warn').mockImplementation(() => {})
    h.evaluateGeneratedResponseSafety.mockReturnValueOnce({
      decision: 'REQUIRE_HUMAN',
      reasonCode: 'PRICE_NOT_FOUND',
      message: 'Generated response contains price quote not grounded in knowledge.',
      requiresHumanReview: true,
    })

    await dispatchInboundToAiReply(ARGS)

    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.state.rpcCalls).toHaveLength(0)
    expect(h.state.updatePayload).toMatchObject({
      ai_autoreply_disabled: true,
      ai_handoff_summary: expect.stringContaining('Response Safety Guard triggered handoff (PRICE_NOT_FOUND)'),
    })
    warnLog.mockRestore()
  })

  it('retries update and fails closed without throwing when conversation update returns an error', async () => {
    const warnLog = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    h.state.updateError = { message: 'Database connection failed' }
    h.generateReply.mockResolvedValueOnce({ text: '', handoff: true })

    await dispatchInboundToAiReply(ARGS)

    expect(h.engineSendText).not.toHaveBeenCalled()
    // Retried 3 times (1 initial + 2 retries)
    expect(h.state.updateCalls).toBe(3)
    warnLog.mockRestore()
    errLog.mockRestore()
  })

  it('retries update and fails closed when conversation update throws an exception', async () => {
    const warnLog = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    h.state.updateThrows = 'Network timeout'
    h.generateReply.mockResolvedValueOnce({ text: '', handoff: true })

    await dispatchInboundToAiReply(ARGS)

    expect(h.engineSendText).not.toHaveBeenCalled()
    expect(h.state.updateCalls).toBe(3)
    warnLog.mockRestore()
    errLog.mockRestore()
  })

  it('ensures subsequent inbound message cannot run AI when conversation is marked disabled', async () => {
    h.state.conv = {
      assigned_agent_id: null,
      ai_autoreply_disabled: true, // already disabled from previous handoff
      ai_reply_count: 1,
    }

    await dispatchInboundToAiReply(ARGS)

    expect(h.generateReply).not.toHaveBeenCalled()
    expect(h.engineSendText).not.toHaveBeenCalled()
  })
})

