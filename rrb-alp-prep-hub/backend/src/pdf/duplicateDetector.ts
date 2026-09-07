import { getDb, schema } from '../db/connection';
import { normalizeText, similarityRatio } from '../utils/helpers';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const EXACT_DUPLICATE_THRESHOLD = 0.98;
const NEAR_DUPLICATE_THRESHOLD = 0.85;

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  isNearDuplicate: boolean;
  existingQuestionId?: string;
  similarity?: number;
}

/**
 * Check if a question already exists in the database.
 * Checks exact match first (normalized), then similarity.
 */
export async function checkDuplicate(
  questionText: string,
  subject?: string,
): Promise<DuplicateCheckResult> {
  const db = getDb();
  const normalizedInput = normalizeText(questionText);

  // Build query — optionally filter by subject for performance
  const existingQuestions = await db
    .select({
      id: schema.questions.id,
      questionText: schema.questions.questionText,
      subjectName: schema.questions.subjectName,
    })
    .from(schema.questions)
    .where(
      subject
        ? eq(schema.questions.subjectName, subject)
        : undefined,
    );

  for (const existing of existingQuestions) {
    const normalizedExisting = normalizeText(existing.questionText);
    const ratio = similarityRatio(normalizedInput, normalizedExisting);

    if (ratio >= EXACT_DUPLICATE_THRESHOLD) {
      logger.debug(`Exact duplicate found: ${existing.id} (similarity: ${ratio.toFixed(3)})`);
      return {
        isDuplicate: true,
        isNearDuplicate: false,
        existingQuestionId: existing.id,
        similarity: ratio,
      };
    }

    if (ratio >= NEAR_DUPLICATE_THRESHOLD) {
      logger.debug(`Near duplicate found: ${existing.id} (similarity: ${ratio.toFixed(3)})`);
      return {
        isDuplicate: false,
        isNearDuplicate: true,
        existingQuestionId: existing.id,
        similarity: ratio,
      };
    }
  }

  return { isDuplicate: false, isNearDuplicate: false };
}
