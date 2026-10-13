import { AiError, type ProviderResult } from '../types'
import { MAX_OUTPUT_TOKENS } from '../defaults'
import {
  mergeConsecutive,
  normalizeUsage,
  providerHttpError,
  toNetworkError,
  type ProviderArgs,
} from './shared'

function resolveEndpoint(apiKey: string, fallback = false): string {
  // If VPS base URL is set but we need fallback, go direct to Gemini
  if (process.env.OPENAI_BASE_URL && !fallback) {
    return `${process.env.OPENAI_BASE_URL.replace(/\/+$/, '')}/chat/completions`
  }
  if (apiKey.startsWith('gsk_')) {
    return 'https://api.groq.com/openai/v1/chat/completions'
  }
  if (apiKey.startsWith('AIzaSy') || apiKey.startsWith('AQ.')) {
    return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  }
  if (apiKey.startsWith('sk-or-')) {
    return 'https://openrouter.ai/api/v1/chat/completions'
  }
  return 'https://api.openai.com/v1/chat/completions'
}

async function callEndpoint(
  url: string,
  apiKey: string,
  model: string,
  messages: object[],
  maxTokens: number,
  timeoutMs: number,
): Promise<OpenAiResponse | null> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  return (await res.json().catch(() => null)) as OpenAiResponse | null
}

interface OpenAiResponse {
  choices?: { message?: { content?: string } }[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

/**
 * Call OpenAI-compatible Chat Completions endpoint (OpenAI, Groq, Gemini, OpenRouter).
 * Returns the raw assistant text + token usage (handoff parsing happens in `generateReply`).
 */
export async function generateOpenAi(args: ProviderArgs): Promise<ProviderResult> {
  const { apiKey, model, systemPrompt, messages, timeoutMs } = args
  const url = resolveEndpoint(apiKey)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...mergeConsecutive(messages),
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw toNetworkError(err)
  }

  if (!res.ok) {
    throw await providerHttpError('OpenAI', res)
  }

  const data = (await res.json().catch(() => null)) as OpenAiResponse | null
  const text = data?.choices?.[0]?.message?.content
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new AiError('OpenAI returned an empty response.', {
      code: 'empty_response',
    })
  }
  const usage = normalizeUsage({
    prompt: data?.usage?.prompt_tokens,
    completion: data?.usage?.completion_tokens,
    total: data?.usage?.total_tokens,
  })
  return { text, usage }
}
