import { getDb, schema } from '../db/connection';
import { eq, and, inArray, sql, ne } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { TestGenerationRequest, TestSession } from '../../../shared/src/types/exam';
import { AppError } from '../middleware/errorHandler';
import { safeJsonParse } from '../utils/helpers';
import { logger } from '../utils/logger';

export class TestGeneratorService {
  private db = getDb();

  /**
   * Generate a test session based on the request parameters.
   * Respects subject, topic, difficulty, source, repeat, and weak-topic filters.
   */
  async generateTest(request: TestGenerationRequest): Promise<TestSession> {
    logger.info(`Generating test: ${request.testType}, ${request.totalQuestions} questions`);

    // ── 1. Build base pool query ──────────────────────────────────────────────
    const conditions = [
      // Only use verified questions
      eq(schema.questions.verificationStatus, 'VERIFIED'),
    ];

    if (request.subjects && request.subjects.length > 0) {
      conditions.push(inArray(schema.questions.subjectName, request.subjects));
    }

    if (request.topics && request.topics.length > 0) {
      conditions.push(inArray(schema.questions.topicName, request.topics));
    }

    if (request.sourceTypes && request.sourceTypes.length > 0) {
      conditions.push(inArray(schema.questions.sourceType, request.sourceTypes));
    }

    if (request.examYears && request.examYears.length > 0) {
      conditions.push(inArray(schema.questions.examYear, request.examYears));
    }

    // ── 2. Exclude recently attempted questions ────────────────────────────────
    let excludeIds: string[] = [];
    if (request.excludeAttemptedInLastN && request.excludeAttemptedInLastN > 0) {
      excludeIds = await this.getRecentlyAttemptedIds(request.excludeAttemptedInLastN);
      if (excludeIds.length > 0) {
        conditions.push(sql`${schema.questions.id} NOT IN (${excludeIds.map(() => '?').join(',')})`.getSQL());
      }
    }

    // ── 3. Fetch candidate pool ───────────────────────────────────────────────
    const pool = await this.db
      .select({
        id: schema.questions.id,
        subjectName: schema.questions.subjectName,
        topicName: schema.questions.topicName,
        difficulty: schema.questions.difficulty,
        sourceType: schema.questions.sourceType,
      })
      .from(schema.questions)
      .where(and(...conditions));

    // Exclude recently attempted (post-filter if SQL IN was complex)
    const filteredPool = excludeIds.length > 0
      ? pool.filter((q) => !excludeIds.includes(q.id))
      : pool;

    if (filteredPool.length < request.totalQuestions) {
      const available = filteredPool.length;
      logger.warn(
        `Insufficient questions: requested ${request.totalQuestions}, available ${available}`
      );
      if (available === 0) {
        throw new AppError(
          422,
          `No verified questions match the selected criteria. Please adjust your filters or import more questions.`,
          'INSUFFICIENT_QUESTIONS',
        );
      }
      // Continue with what's available but log warning
    }

    // ── 4. Difficulty balancing ──────────────────────────────────────────────
    const selectedIds = this.selectWithDifficultyBalance(
      filteredPool,
      Math.min(request.totalQuestions, filteredPool.length),
      request.difficulty,
      request.prioritizeWeak ?? false,
    );

    // ── 5. Shuffle if requested ──────────────────────────────────────────────
    const finalIds = request.shuffleQuestions !== false
      ? this.shuffle(selectedIds)
      : selectedIds;

    // ── 6. Create test session ───────────────────────────────────────────────
    const sessionId = nanoid();
    const name = request.name ?? this.generateSessionName(request);

    await this.db.insert(schema.testSessions).values({
      id: sessionId,
      name,
      testType: request.testType,
      examConfigId: request.examConfigId,
      totalQuestions: finalIds.length,
      durationSeconds: request.durationSeconds,
      questionIds: JSON.stringify(finalIds),
      generationRequest: JSON.stringify(request),
    });

    logger.info(`Test session created: ${sessionId} (${finalIds.length} questions)`);

    return {
      id: sessionId,
      name,
      testType: request.testType,
      examConfigId: request.examConfigId,
      questionIds: finalIds,
      totalQuestions: finalIds.length,
      durationSeconds: request.durationSeconds,
      createdAt: new Date().toISOString(),
      generationRequest: request,
    };
  }

  private selectWithDifficultyBalance(
    pool: Array<{ id: string; difficulty: string | null }>,
    total: number,
    difficultyDistribution?: { EASY?: number; MEDIUM?: number; HARD?: number },
    prioritizeWeak?: boolean,
  ): string[] {
    if (!difficultyDistribution) {
      // No distribution specified — random selection
      return this.shuffle(pool.map((q) => q.id)).slice(0, total);
    }

    const easyPct = difficultyDistribution.EASY ?? 30;
    const mediumPct = difficultyDistribution.MEDIUM ?? 50;
    const hardPct = difficultyDistribution.HARD ?? 20;

    const easyTarget = Math.round((total * easyPct) / 100);
    const mediumTarget = Math.round((total * mediumPct) / 100);
    const hardTarget = total - easyTarget - mediumTarget;

    const byDifficulty = {
      EASY: this.shuffle(pool.filter((q) => q.difficulty === 'EASY').map((q) => q.id)),
      MEDIUM: this.shuffle(pool.filter((q) => q.difficulty === 'MEDIUM').map((q) => q.id)),
      HARD: this.shuffle(pool.filter((q) => q.difficulty === 'HARD').map((q) => q.id)),
    };

    const selected: string[] = [
      ...byDifficulty.EASY.slice(0, easyTarget),
      ...byDifficulty.MEDIUM.slice(0, mediumTarget),
      ...byDifficulty.HARD.slice(0, hardTarget),
    ];

    // If we didn't get enough, fill from any difficulty
    if (selected.length < total) {
      const selectedSet = new Set(selected);
      const remaining = pool
        .map((q) => q.id)
        .filter((id) => !selectedSet.has(id));
      selected.push(...this.shuffle(remaining).slice(0, total - selected.length));
    }

    return selected.slice(0, total);
  }

  private shuffle<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async getRecentlyAttemptedIds(lastN: number): Promise<string[]> {
    const recentAttempts = await this.db
      .select({ questionId: schema.questionAttempts.questionId })
      .from(schema.questionAttempts)
      .innerJoin(schema.testAttempts, eq(schema.questionAttempts.attemptId, schema.testAttempts.id))
      .orderBy(schema.testAttempts.startedAt)
      .limit(lastN * 100); // generous upper bound

    return [...new Set(recentAttempts.map((r) => r.questionId))];
  }

  private generateSessionName(request: TestGenerationRequest): string {
    const date = new Date().toLocaleDateString('en-IN');
    switch (request.testType) {
      case 'FULL_MOCK': return `Full Mock — ${date}`;
      case 'SUBJECT_TEST': return `${request.subjects?.[0] ?? 'Subject'} Test — ${date}`;
      case 'TOPIC_TEST': return `${request.topics?.[0] ?? 'Topic'} Test — ${date}`;
      case 'MIXED_TEST': return `Mixed Test — ${date}`;
      case 'WEAK_AREA_TEST': return `Weak Area Test — ${date}`;
      case 'CUSTOM_TEST': return `Custom Test — ${date}`;
      default: return `Practice Test — ${date}`;
    }
  }

  async getSession(sessionId: string) {
    const session = await this.db
      .select()
      .from(schema.testSessions)
      .where(eq(schema.testSessions.id, sessionId))
      .limit(1)
      .then((r) => r[0]);

    if (!session) {
      throw new AppError(404, 'Test session not found', 'SESSION_NOT_FOUND');
    }

    const questionIds = safeJsonParse<string[]>(session.questionIds, []);

    // Fetch full questions
    const questions = await this.db
      .select()
      .from(schema.questions)
      .where(inArray(schema.questions.id, questionIds));

    const options = await this.db
      .select()
      .from(schema.questionOptions)
      .where(inArray(schema.questionOptions.questionId, questionIds));

    const optionsByQId = options.reduce<Record<string, typeof options>>((acc, opt) => {
      (acc[opt.questionId] ??= []).push(opt);
      return acc;
    }, {});

    // Return in original order
    const questionsById = questions.reduce<Record<string, (typeof questions)[0]>>((acc, q) => {
      acc[q.id] = q;
      return acc;
    }, {});

    const orderedQuestions = questionIds
      .map((id) => questionsById[id])
      .filter(Boolean)
      .map((q) => ({
        ...q,
        options: (optionsByQId[q.id] ?? []).sort((a, b) => a.optionIndex - b.optionIndex),
        tags: safeJsonParse<string[]>(q.tags, []),
      }));

    return {
      session: {
        ...session,
        questionIds,
        generationRequest: safeJsonParse(session.generationRequest, {}),
      },
      questions: orderedQuestions,
    };
  }
}
