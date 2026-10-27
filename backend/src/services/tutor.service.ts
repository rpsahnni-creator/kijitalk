import type { Lesson, MistakeLog } from '@prisma/client';
import { chatWithClaude, isClaudeAvailable } from './claude.service';
import { chatWithGemini } from './gemini.service';
import { ChatResponse, KIKI_SYSTEM, TutorMessage } from './tutorPrompt';
import { findRelevantMistakes, findSimilarLessons, logMistakesFromCorrections } from './rag.service';
import { logger } from '../utils/logger';

export type TutorEngine = 'gemini' | 'claude';

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
  userId?: string
): Promise<ChatResponse & { engineUsed: TutorEngine }> {
  const basePrompt = systemPrompt ?? KIKI_SYSTEM;

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

  const result =
    engine === 'claude' && isClaudeAvailable()
      ? { ...(await chatWithClaude(message, history, augmentedPrompt)), engineUsed: 'claude' as const }
      : { ...(await chatWithGemini(message, history, augmentedPrompt)), engineUsed: 'gemini' as const };

  if (userId && result.corrections.length > 0) {
    void logMistakesFromCorrections(userId, result.corrections).catch((error) =>
      logger.warn('Fire-and-forget mistake logging failed', error)
    );
  }

  return result;
}
