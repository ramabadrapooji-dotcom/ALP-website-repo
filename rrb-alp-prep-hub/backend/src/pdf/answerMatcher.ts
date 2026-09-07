import type { ExtractedQuestion } from '../../../shared/src/types/import';
import type { AnswerKeyEntry } from './answerKeyParser';
import { CONFIDENCE_THRESHOLDS } from '../../../shared/src/constants/examConfig';
import { logger } from '../utils/logger';

export interface MatchedQuestion extends ExtractedQuestion {
  detectedAnswer?: number;
  answerLabel?: string;
  answerMappingConfidence: number;
  verificationStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'UNVERIFIED';
}

/**
 * Match extracted questions to their answers from the answer key.
 * Uses explicit question-number matching — NOT array position.
 */
export function matchAnswers(
  questions: ExtractedQuestion[],
  answerKey: Map<number, AnswerKeyEntry>,
): MatchedQuestion[] {
  const matched: MatchedQuestion[] = [];
  let successCount = 0;
  let lowConfCount = 0;

  for (const q of questions) {
    const entry = answerKey.get(q.questionNumber);

    if (!entry) {
      // No answer found for this question number
      logger.debug(`No answer found for Q${q.questionNumber}`);
      matched.push({
        ...q,
        answerMappingConfidence: 0,
        verificationStatus: 'NEEDS_REVIEW',
      });
      continue;
    }

    // Validate answer index is within options range
    const answerIndex = entry.answerIndex;
    const isValidIndex = answerIndex >= 0 && answerIndex < q.options.length;

    if (!isValidIndex) {
      logger.warn(
        `Q${q.questionNumber}: Answer index ${answerIndex} out of range (${q.options.length} options)`
      );
      matched.push({
        ...q,
        detectedAnswer: answerIndex,
        answerLabel: entry.answerLabel,
        answerMappingConfidence: 30,
        verificationStatus: 'NEEDS_REVIEW',
      });
      continue;
    }

    // Calculate mapping confidence
    // Higher extraction confidence + answer found = higher mapping confidence
    const baseConfidence = q.extractionConfidence;
    const mappingConfidence = Math.min(
      100,
      baseConfidence * 0.6 +   // extraction quality weight
      40 *                      // bonus for finding the answer
      (isValidIndex ? 1 : 0.3)
    );

    const verificationStatus = getVerificationStatus(mappingConfidence);
    if (verificationStatus === 'VERIFIED') successCount++;
    else lowConfCount++;

    matched.push({
      ...q,
      detectedAnswer: answerIndex,
      answerLabel: entry.answerLabel,
      answerMappingConfidence: mappingConfidence,
      verificationStatus,
    });
  }

  logger.info(
    `Answer matching: ${successCount} verified, ${lowConfCount} need review, ` +
    `${questions.length - successCount - lowConfCount} missing`
  );

  return matched;
}

function getVerificationStatus(
  confidence: number,
): 'VERIFIED' | 'NEEDS_REVIEW' | 'UNVERIFIED' {
  if (confidence >= CONFIDENCE_THRESHOLDS.VERIFIED) return 'VERIFIED';
  if (confidence >= CONFIDENCE_THRESHOLDS.NEEDS_REVIEW) return 'NEEDS_REVIEW';
  return 'UNVERIFIED';
}
