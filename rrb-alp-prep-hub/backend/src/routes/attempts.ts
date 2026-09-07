import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDb, schema } from '../db/connection';
import { eq, sql } from 'drizzle-orm';
import { validateRequest } from '../middleware/validator';
import { SubmitAttemptSchema } from '../../../shared/src/validation/schemas';
import { calculateScore, ScoringConfig } from '../services/scoringService';
import { AppError } from '../middleware/errorHandler';
import { safeJsonParse } from '../utils/helpers';
import type { QuestionAttemptRecord, TestSession, ExamConfiguration } from '../../../shared/src/types/exam';

const router = Router();
const db = getDb();

// Submit an attempt
router.post('/submit', validateRequest({ body: SubmitAttemptSchema }), async (req, res, next) => {
  try {
    const { sessionId, answers, questionTimings, startedAt, submittedAt, autoSubmitted } = req.body;
    const userId = 'default-user'; // single-user for now

    // 1. Get session and config
    const session = await db.select().from(schema.testSessions).where(eq(schema.testSessions.id, sessionId)).limit(1).then(r => r[0]);
    if (!session) throw new AppError(404, 'Test session not found', 'SESSION_NOT_FOUND');

    let examConfig: ScoringConfig | undefined;
    if (session.examConfigId) {
      const conf = await db.select().from(schema.examConfigurations).where(eq(schema.examConfigurations.id, session.examConfigId)).limit(1).then(r => r[0]);
      if (conf) {
        examConfig = {
          marksPerCorrect: conf.marksPerCorrect,
          negativeMarksPerWrong: conf.negativeMarksPerWrong,
          totalQuestions: conf.totalQuestions,
        };
      }
    }

    const questionIds = safeJsonParse<string[]>(session.questionIds, []);
    
    // 2. Get correct answers & question metadata
    const questions = await db
      .select({
        id: schema.questions.id,
        correctAnswer: schema.questions.correctAnswer,
        subjectName: schema.questions.subjectName,
        topicName: schema.questions.topicName,
        difficulty: schema.questions.difficulty,
      })
      .from(schema.questions)
      .where(sql`${schema.questions.id} IN ${questionIds}`);

    const qMap = new Map(questions.map(q => [q.id, q]));

    // 3. Build QuestionAttemptRecords
    const attemptRecords: QuestionAttemptRecord[] = [];
    
    for (const qId of questionIds) {
      const q = qMap.get(qId);
      if (!q) continue;

      const selectedAnswer = answers[qId] ?? null;
      const wasAttempted = selectedAnswer !== null;
      const isCorrect = wasAttempted && selectedAnswer === q.correctAnswer;
      const timeMs = questionTimings[qId]?.totalTimeMs ?? 0;
      const marked = req.body.markedForReview.includes(qId);

      attemptRecords.push({
        questionId: qId,
        selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        wasAttempted,
        wasMarkedForReview: marked,
        timeSpentMs: timeMs,
        subject: q.subjectName ?? undefined,
        topic: q.topicName ?? undefined,
      });
    }

    // 4. Calculate score
    const durationSeconds = Math.round((submittedAt - startedAt) / 1000);
    const scoreResult = calculateScore(
      attemptRecords, 
      durationSeconds * 1000, 
      examConfig ?? { totalQuestions: session.totalQuestions }
    );

    // 5. Save to Database Transaction
    const attemptId = nanoid();

    await db.transaction(async (tx) => {
      // Create TestAttempt
      await tx.insert(schema.testAttempts).values({
        id: attemptId,
        sessionId,
        userId,
        testType: session.testType,
        testName: session.name,
        status: 'SUBMITTED',
        autoSubmitted,
        startedAt: new Date(startedAt).toISOString(),
        submittedAt: new Date(submittedAt).toISOString(),
        durationSeconds,
        totalTimeUsedMs: durationSeconds * 1000,
        
        totalQuestions: scoreResult.totalQuestions,
        attempted: scoreResult.attempted,
        correct: scoreResult.correct,
        incorrect: scoreResult.incorrect,
        unattempted: scoreResult.unattempted,
        positiveMarks: scoreResult.positiveMarks,
        negativeMarks: scoreResult.negativeMarks,
        finalScore: scoreResult.finalScore,
        maxPossibleScore: scoreResult.maxPossibleScore,
        accuracy: scoreResult.accuracy,
        attemptRate: scoreResult.attemptRate,
        
        scoreJson: JSON.stringify(scoreResult),
      });

      // Create QuestionAttempts and Update PerformanceRecords
      for (const rec of attemptRecords) {
        const q = qMap.get(rec.questionId);
        
        await tx.insert(schema.questionAttempts).values({
          id: nanoid(),
          attemptId,
          questionId: rec.questionId,
          userId,
          selectedAnswer: rec.selectedAnswer,
          correctAnswer: rec.correctAnswer,
          isCorrect: rec.isCorrect,
          wasAttempted: rec.wasAttempted,
          wasMarkedForReview: rec.wasMarkedForReview,
          timeSpentMs: rec.timeSpentMs,
          answerChanges: questionTimings[rec.questionId]?.answerChanges ?? 0,
          subjectName: q?.subjectName,
          topicName: q?.topicName,
          difficulty: q?.difficulty,
        });

        // Update Performance Record
        if (q?.subjectName) {
          // Get existing performance or initialize
          const [existingPerf] = await tx
            .select()
            .from(schema.performanceRecords)
            .where(
              sql`${schema.performanceRecords.userId} = ${userId} AND ${schema.performanceRecords.questionId} = ${rec.questionId}`
            )
            .limit(1);

          if (existingPerf) {
            const newTotalAttempts = existingPerf.totalAttempts + 1;
            const newAvgTime = ((existingPerf.averageTimeMs * existingPerf.totalAttempts) + rec.timeSpentMs) / newTotalAttempts;
            
            await tx
              .update(schema.performanceRecords)
              .set({
                totalAttempts: newTotalAttempts,
                correctAttempts: existingPerf.correctAttempts + (rec.isCorrect ? 1 : 0),
                incorrectAttempts: existingPerf.incorrectAttempts + (rec.wasAttempted && !rec.isCorrect ? 1 : 0),
                averageTimeMs: newAvgTime,
                lastAttemptedAt: new Date(submittedAt).toISOString(),
                lastResult: rec.wasAttempted ? (rec.isCorrect ? 'CORRECT' : 'INCORRECT') : 'SKIPPED',
                testsUsedIn: existingPerf.testsUsedIn + 1,
              })
              .where(eq(schema.performanceRecords.id, existingPerf.id));
          } else {
            await tx.insert(schema.performanceRecords).values({
              id: nanoid(),
              userId,
              questionId: rec.questionId,
              subjectName: q.subjectName,
              topicName: q.topicName,
              totalAttempts: 1,
              correctAttempts: rec.isCorrect ? 1 : 0,
              incorrectAttempts: rec.wasAttempted && !rec.isCorrect ? 1 : 0,
              averageTimeMs: rec.timeSpentMs,
              lastAttemptedAt: new Date(submittedAt).toISOString(),
              lastResult: rec.wasAttempted ? (rec.isCorrect ? 'CORRECT' : 'INCORRECT') : 'SKIPPED',
              testsUsedIn: 1,
            });
          }
        }
      }
    });

    res.status(201).json({ success: true, data: { attemptId, score: scoreResult } });
  } catch (err) {
    next(err);
  }
});

// Get attempt details for Review Page
router.get('/:id', async (req, res, next) => {
  try {
    const attemptId = req.params.id;
    const attempt = await db.select().from(schema.testAttempts).where(eq(schema.testAttempts.id, attemptId)).limit(1).then(r => r[0]);
    if (!attempt) throw new AppError(404, 'Attempt not found', 'ATTEMPT_NOT_FOUND');

    const qAttempts = await db
      .select({
        qa: schema.questionAttempts,
        q: {
          questionText: schema.questions.questionText,
          explanation: schema.questions.explanation,
          subjectName: schema.questions.subjectName,
          topicName: schema.questions.topicName,
          difficulty: schema.questions.difficulty,
          sourceName: schema.questions.sourceName,
        }
      })
      .from(schema.questionAttempts)
      .innerJoin(schema.questions, eq(schema.questionAttempts.questionId, schema.questions.id))
      .where(eq(schema.questionAttempts.attemptId, attemptId));
      
    // Fetch options for these questions
    const questionIds = qAttempts.map(row => row.qa.questionId);
    
    const options = questionIds.length > 0 
      ? await db.select().from(schema.questionOptions).where(sql`${schema.questionOptions.questionId} IN ${questionIds}`)
      : [];
      
    const optionsByQId = options.reduce<Record<string, typeof options>>((acc, opt) => {
      (acc[opt.questionId] ??= []).push(opt);
      return acc;
    }, {});

    const scoreData = safeJsonParse<any>(attempt.scoreJson, {});

    const enrichedQuestionAttempts = qAttempts.map(row => {
      const sortedOpts = (optionsByQId[row.qa.questionId] ?? []).sort((a, b) => a.optionIndex - b.optionIndex);
      const selectedIdx = row.qa.selectedAnswer;
      const correctIdx = row.qa.correctAnswer;
      return {
        questionId: row.qa.questionId,
        questionText: row.q.questionText,
        explanation: row.q.explanation,
        subject: row.q.subjectName,
        topic: row.q.topicName,
        difficulty: row.q.difficulty,
        isCorrect: row.qa.isCorrect,
        wasAttempted: row.qa.wasAttempted,
        wasMarkedForReview: row.qa.wasMarkedForReview,
        timeSpentMs: row.qa.timeSpentMs,
        selectedOptionIndex: selectedIdx,
        correctOptionIndex: correctIdx,
        selectedOptionText: selectedIdx !== null && selectedIdx !== undefined ? (sortedOpts[selectedIdx]?.optionText ?? '') : null,
        correctOptionText: correctIdx !== null && correctIdx !== undefined ? (sortedOpts[correctIdx]?.optionText ?? '') : null,
        options: sortedOpts,
      };
    });

    // Build subject breakdown from per-question data
    const subjectMap = new Map<string, { subject: string; attempted: number; correct: number; incorrect: number; totalTimeMs: number }>();
    for (const qa of enrichedQuestionAttempts) {
      const subj = qa.subject ?? 'General';
      if (!subjectMap.has(subj)) subjectMap.set(subj, { subject: subj, attempted: 0, correct: 0, incorrect: 0, totalTimeMs: 0 });
      const s = subjectMap.get(subj)!;
      if (qa.wasAttempted) {
        s.attempted++;
        if (qa.isCorrect) s.correct++;
        else s.incorrect++;
      }
      s.totalTimeMs += qa.timeSpentMs ?? 0;
    }
    const subjectBreakdown = Array.from(subjectMap.values()).map(s => ({
      ...s,
      accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
      score: s.correct - s.incorrect * (1 / 3),
      averageTimeSeconds: s.attempted > 0 ? Math.round((s.totalTimeMs / s.attempted) / 1000) : 0,
    }));

    res.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          testName: attempt.testName,
          testType: attempt.testType,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          durationSeconds: attempt.durationSeconds,
          totalQuestions: attempt.totalQuestions,
          attempted: attempt.attempted,
          correct: attempt.correct,
          incorrect: attempt.incorrect,
          unattempted: attempt.unattempted,
          finalScore: attempt.finalScore,
          maxPossibleScore: attempt.maxPossibleScore,
          accuracy: attempt.accuracy,
        },
        score: scoreData,
        subjectBreakdown,
        questionAttempts: enrichedQuestionAttempts,
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
