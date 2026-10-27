import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ChatResponse, KIKI_SYSTEM, TutorMessage, offlineKikiResponse, parseTutorJson } from './tutorPrompt';

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export function isClaudeAvailable(): boolean {
  return client !== null;
}

export async function chatWithClaude(
  message: string,
  history: TutorMessage[] = [],
  systemPrompt?: string
): Promise<ChatResponse> {
  if (!client) return offlineKikiResponse(message);

  try {
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
  } catch (error) {
    logger.error('Claude API error:', error);
    return offlineKikiResponse(message);
  }
}
