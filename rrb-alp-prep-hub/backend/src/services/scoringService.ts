import type { ScoreResult, QuestionAttemptRecord, SubjectScore } from '../../../shared/src/types/exam';

export interface ScoringConfig {
  marksPerCorrect: number;
  negativeMarksPerWrong: number;
  totalQuestions: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
  marksPerCorrect: 1,
  negativeMarksPerWrong: 1 / 3,
  totalQuestions: 75,
};

/**
 * Calculate the score for a completed test attempt.
 * Supports configurable positive/negative marking.
 */
export function calculateScore(
  questionAttempts: QuestionAttemptRecord[],
  totalTimeMs: number,
  config: Partial<ScoringConfig> = {},
): ScoreResult {
  const {
    marksPerCorrect,
    negativeMarksPerWrong,
    totalQuestions,
  } = { ...DEFAULT_CONFIG, ...config };

  let correct = 0;
  let incorrect = 0;
  let attempted = 0;

  for (const qa of questionAttempts) {
    if (qa.wasAttempted && qa.selectedAnswer !== null) {
      attempted++;
      if (qa.isCorrect) correct++;
      else incorrect++;
    }
  }

  const unattempted = totalQuestions - attempted;
  const positiveMarks = correct * marksPerCorrect;
  const negativeMarks = incorrect * negativeMarksPerWrong;
  const finalScore = Math.max(0, positiveMarks - negativeMarks);
  const maxPossibleScore = totalQuestions * marksPerCorrect;
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;
  const attemptRate = (attempted / totalQuestions) * 100;
  const averageTimePerQuestionMs = totalQuestions > 0 ? totalTimeMs / totalQuestions : 0;

  // Per-subject breakdown
  const subjectMap = new Map<string, {
    total: number; attempted: number; correct: number; incorrect: number; score: number;
  }>();

  for (const qa of questionAttempts) {
    const subject = qa.subject ?? 'Unknown';
    const entry = subjectMap.get(subject) ?? { total: 0, attempted: 0, correct: 0, incorrect: 0, score: 0 };
    entry.total++;
    if (qa.wasAttempted && qa.selectedAnswer !== null) {
      entry.attempted++;
      if (qa.isCorrect) {
        entry.correct++;
        entry.score += marksPerCorrect;
      } else {
        entry.incorrect++;
        entry.score -= negativeMarksPerWrong;
      }
    }
    subjectMap.set(subject, entry);
  }

  const subjectBreakdown: SubjectScore[] = Array.from(subjectMap.entries()).map(
    ([subject, data]) => ({
      subject,
      totalQuestions: data.total,
      attempted: data.attempted,
      correct: data.correct,
      incorrect: data.incorrect,
      score: Math.max(0, data.score),
      accuracy: data.attempted > 0 ? (data.correct / data.attempted) * 100 : 0,
    }),
  );

  return {
    totalQuestions,
    attempted,
    correct,
    incorrect,
    unattempted,
    positiveMarks,
    negativeMarks,
    finalScore: Math.round(finalScore * 100) / 100,
    maxPossibleScore,
    accuracy: Math.round(accuracy * 100) / 100,
    attemptRate: Math.round(attemptRate * 100) / 100,
    totalTimeMs,
    averageTimePerQuestionMs: Math.round(averageTimePerQuestionMs),
    subjectBreakdown,
  };
}
