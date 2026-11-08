import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ChatResponse, KIKI_SYSTEM, TutorMessage, offlineKikiResponse, parseTutorJson } from './tutorPrompt';

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export function isClaudeAvailable(): boolean {
  return client !== null;
}

/** One Claude tutor reply. Throws on failure — the tutor service then falls back. */
export async function claudeReply(
  message: string,
  history: TutorMessage[] = [],
  systemPrompt?: string
): Promise<ChatResponse> {
  if (!client) throw new Error('Claude is not configured (ANTHROPIC_API_KEY missing)');

  const response = await client.messages.create({
    model: env.CLAUDE_MODEL,
    max_tokens: 512,
    system: systemPrompt ?? KIKI_SYSTEM,
    messages: [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: message },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  return parseTutorJson(text, message);
}

export async function chatWithClaude(
  message: string,
  history: TutorMessage[] = [],
  systemPrompt?: string
): Promise<ChatResponse> {
  try {
    return await claudeReply(message, history, systemPrompt);
  } catch (error) {
    logger.error('Claude API error:', error);
    return offlineKikiResponse(message);
  }
}
