import type { Lesson, MistakeLog } from '@prisma/client';
import { claudeReply, isClaudeAvailable } from './claude.service';
import { geminiReply } from './gemini.service';
import { ChatResponse, KIKI_SYSTEM, TutorMessage, offlineKikiResponse } from './tutorPrompt';
import { AiFeature, isProviderPaused, recordAiCall } from './aiMonitor.service';
import { env } from '../config/env';
import { findRelevantMistakes, findSimilarLessons, logMistakesFromCorrections } from './rag.service';
import { logger } from '../utils/logger';

export type TutorEngine = 'gemini' | 'claude';

const PROVIDERS: Record<TutorEngine, typeof geminiReply> = { gemini: geminiReply, claude: claudeReply };

/** Home languages Kiki can teach from (onboarding/settings "nativeLanguage"). */
export const HOME_LANGUAGES: Record<string, string> = {
  hi: 'Hindi',
  ta: 'Tamil',
  bn: 'Bengali',
  mr: 'Marathi',
  te: 'Telugu',
};

export function languageInstruction(code: string | null | undefined): string | null {
  const name = code ? HOME_LANGUAGES[code] : undefined;
  if (!name || code === 'hi') return null; // the base prompt already covers Hindi/Hinglish
  return `This student's home language is ${name}. They may write in ${name} script or in ${name} typed with Roman letters, or mix it with English. Treat that exactly like the Hindi/Hinglish case: give a natural English "translation", teach the English phrase in your reply, and set "wasHindi" to true for any non-English input. Keep your reply in simple English; you may add a few words of ${name} only when it helps explain a tip.`;
}

/**
 * Which providers to try, in order: the requested one first, then the other as
 * a fallback (when it's configured and allowed), skipping any provider whose
 * circuit breaker is open. A paused provider is still tried last-ditch if it's
 * the only option, so a recovered provider is noticed.
 */
export function providerOrder(requested: TutorEngine | undefined): TutorEngine[] {
  const preferred: TutorEngine = requested === 'claude' && isClaudeAvailable() ? 'claude' : 'gemini';
  const order: TutorEngine[] = [preferred];
  const other: TutorEngine = preferred === 'gemini' ? 'claude' : 'gemini';
  const otherUsable = other === 'claude' ? isClaudeAvailable() && env.AI_FALLBACK_TO_CLAUDE : true;
  if (otherUsable) order.push(other);
  const healthy = order.filter((p) => !isProviderPaused(p));
  return healthy.length > 0 ? healthy : order.slice(0, 1);
}

export function availableEngines(): { gemini: boolean; claude: boolean } {
  return { gemini: true, claude: isClaudeAvailable() };
}

function buildAugmentedSystemPrompt(
  basePrompt: string,
  relevantLessons: Lesson[],
  relevantMistakes: MistakeLog[]
): string {
  const sections: string[] = [basePrompt];

  if (relevantLessons.length > 0) {
    const lessonBlock = relevantLessons
      .map((l) => `- "${l.title}" (${l.category}): key vocabulary — ${l.vocabulary.slice(0, 6).join(', ')}`)
      .join('\n');
    sections.push(
      `Relevant teaching material from this student's own curriculum (use it to ground your explanation and stay consistent with how KijiTalk teaches this, but reply naturally — don't just list this):\n${lessonBlock}`
    );
  }

  if (relevantMistakes.length > 0) {
    const mistakeBlock = relevantMistakes
      .map((m) => `- "${m.original}" → "${m.corrected}"`)
      .join('\n');
    sections.push(
      `This student's recent English mistakes (reference their progress naturally when it fits, e.g. "you used to say X, now you're saying Y correctly!" — don't force it every turn):\n${mistakeBlock}`
    );
  }

  return sections.join('\n\n');
}

export async function generateTutorReply(
  engine: TutorEngine | undefined,
  message: string,
  history: TutorMessage[] = [],
  systemPrompt?: string,
  userId?: string,
  feature: AiFeature = 'chat',
  nativeLanguage?: string | null
): Promise<ChatResponse & { engineUsed: TutorEngine | 'offline' }> {
  const langNote = languageInstruction(nativeLanguage);
  const basePrompt = langNote ? `${systemPrompt ?? KIKI_SYSTEM}

${langNote}` : systemPrompt ?? KIKI_SYSTEM;

  let augmentedPrompt = basePrompt;
  try {
    const [relevantLessons, relevantMistakes] = await Promise.all([
      findSimilarLessons(message, { limit: 3 }),
      userId ? findRelevantMistakes(userId, message, 3) : Promise.resolve([]),
    ]);
    augmentedPrompt = buildAugmentedSystemPrompt(basePrompt, relevantLessons, relevantMistakes);
  } catch (error) {
    logger.warn('RAG context retrieval failed, continuing without augmentation', error);
  }

  let result: (ChatResponse & { engineUsed: TutorEngine | 'offline' }) | null = null;
  const order = providerOrder(engine);
  for (const [index, provider] of order.entries()) {
    const started = Date.now();
    try {
      const reply = await PROVIDERS[provider](message, history, augmentedPrompt);
      recordAiCall({ provider, feature, ok: true, latencyMs: Date.now() - started, fallback: index > 0, userId });
      if (index > 0) logger.warn(`AI fallback: answered by ${provider} after ${order.slice(0, index).join(', ')} failed`);
      result = { ...reply, engineUsed: provider };
      break;
    } catch (error) {
      recordAiCall({ provider, feature, ok: false, latencyMs: Date.now() - started, userId, error });
    }
  }

  if (!result) {
    // Every provider failed — reply with a friendly canned message instead of an error.
    recordAiCall({ provider: 'offline', feature, ok: false, latencyMs: 0, fallback: true, userId });
    result = { ...offlineKikiResponse(message), engineUsed: 'offline' };
  }

  if (userId && result.corrections.length > 0) {
    void logMistakesFromCorrections(userId, result.corrections).catch((error) =>
      logger.warn('Fire-and-forget mistake logging failed', error)
    );
  }

  return result;
}
