import { getDb, schema } from '../db/connection';
import { eq, desc, sql } from 'drizzle-orm';
import type { AnalyticsOverview, SubjectAnalytics, TopicAnalytics, ScoreTrendPoint, TimeAnalytics } from '../../../shared/src/types/analytics';
import { MIN_QUESTIONS_FOR_WEAK_DETECTION, WEAK_TOPIC_THRESHOLD } from '../../../shared/src/constants/examConfig';
import { logger } from '../utils/logger';

export class AnalyticsService {
  private db = getDb();

  async getOverview(userId: string = 'default-user'): Promise<AnalyticsOverview> {
    const attempts = await this.db
      .select()
      .from(schema.testAttempts)
      .where(eq(schema.testAttempts.userId, userId))
      .orderBy(desc(schema.testAttempts.startedAt));

    if (attempts.length === 0) {
      return {
        userId,
        totalTests: 0,
        totalQuestionsAttempted: 0,
        averageScore: 0,
        bestScore: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        currentStreak: 0,
        averageTimePerQuestionMs: 0,
      };
    }

    let totalScore = 0;
    let bestScore = 0;
    let totalAccuracy = 0;
    let bestAccuracy = 0;
    let totalQuestionsAttempted = 0;
    let totalTimeMs = 0;

    for (const attempt of attempts) {
      totalScore += attempt.finalScore;
      if (attempt.finalScore > bestScore) bestScore = attempt.finalScore;
      
      totalAccuracy += attempt.accuracy;
      if (attempt.accuracy > bestAccuracy) bestAccuracy = attempt.accuracy;
      
      totalQuestionsAttempted += attempt.attempted;
      totalTimeMs += attempt.totalTimeUsedMs ?? 0;
    }

    return {
      userId,
      totalTests: attempts.length,
      totalQuestionsAttempted,
      averageScore: Math.round((totalScore / attempts.length) * 100) / 100,
      bestScore,
      averageAccuracy: Math.round((totalAccuracy / attempts.length) * 100) / 100,
      bestAccuracy,
      currentStreak: this.calculateStreak(attempts),
      lastAttemptedAt: attempts[0].startedAt,
      averageTimePerQuestionMs: totalQuestionsAttempted > 0 ? Math.round(totalTimeMs / totalQuestionsAttempted) : 0,
    };
  }

  async getScoreTrend(userId: string = 'default-user', limit: number = 10): Promise<ScoreTrendPoint[]> {
    const attempts = await this.db
      .select({
        id: schema.testAttempts.id,
        testName: schema.testAttempts.testName,
        startedAt: schema.testAttempts.startedAt,
        finalScore: schema.testAttempts.finalScore,
        maxPossibleScore: schema.testAttempts.maxPossibleScore,
        accuracy: schema.testAttempts.accuracy,
        testType: schema.testAttempts.testType,
      })
      .from(schema.testAttempts)
      .where(eq(schema.testAttempts.userId, userId))
      .orderBy(desc(schema.testAttempts.startedAt))
      .limit(limit);

    return attempts.reverse().map((a) => ({
      attemptId: a.id,
      testName: a.testName,
      date: new Date(a.startedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      score: a.finalScore,
      maxScore: a.maxPossibleScore,
      accuracy: a.accuracy,
      testType: a.testType,
    }));
  }

  async getSubjectAnalytics(userId: string = 'default-user'): Promise<SubjectAnalytics[]> {
    const records = await this.db
      .select({
        subjectName: schema.performanceRecords.subjectName,
        totalAttempts: sql<number>`SUM(${schema.performanceRecords.totalAttempts})`,
        correctAttempts: sql<number>`SUM(${schema.performanceRecords.correctAttempts})`,
        incorrectAttempts: sql<number>`SUM(${schema.performanceRecords.incorrectAttempts})`,
        avgTime: sql<number>`AVG(${schema.performanceRecords.averageTimeMs})`,
      })
      .from(schema.performanceRecords)
      .where(eq(schema.performanceRecords.userId, userId))
      .groupBy(schema.performanceRecords.subjectName);

    return records.map((r) => {
      const attempted = r.correctAttempts + r.incorrectAttempts;
      return {
        subject: r.subjectName,
        totalAttempted: attempted,
        correct: r.correctAttempts,
        incorrect: r.incorrectAttempts,
        accuracy: attempted > 0 ? (r.correctAttempts / attempted) * 100 : 0,
        averageTimeMs: Math.round(r.avgTime),
        testsCount: 0,
        trend: 'STABLE' as const,
      };
    }).sort((a, b) => b.totalAttempted - a.totalAttempted);
  }

  private calculateStreak(attempts: Array<{ startedAt: string }>): number {
    if (attempts.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Get unique dates
    const attemptDates = [...new Set(attempts.map(a => {
      const d = new Date(a.startedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a); // descending

    // Check if practiced today or yesterday
    const lastPractice = attemptDates[0];
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceLastPractice = (currentDate.getTime() - lastPractice) / msPerDay;

    if (daysSinceLastPractice > 1) return 0; // Streak broken

    let checkDate = attemptDates[0];
    for (const date of attemptDates) {
      if (date === checkDate) {
        streak++;
        checkDate -= msPerDay;
      } else {
        break;
      }
    }
    return streak;
  }
}
