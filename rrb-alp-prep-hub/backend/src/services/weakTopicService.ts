import { getDb, schema } from '../db/connection';
import { eq, sql, isNotNull } from 'drizzle-orm';
import type { WeakTopic, TopicAnalytics } from '../../../shared/src/types/analytics';
import { MIN_QUESTIONS_FOR_WEAK_DETECTION, WEAK_TOPIC_THRESHOLD } from '../../../shared/src/constants/examConfig';

export class WeakTopicService {
  private db = getDb();

  async getWeakTopics(userId: string = 'default-user'): Promise<WeakTopic[]> {
    const topics = await this.getTopicAnalytics(userId);
    
    return topics
      .filter((t) => t.isWeak && t.totalAttempted >= MIN_QUESTIONS_FOR_WEAK_DETECTION)
      .map((t) => ({
        subject: t.subject,
        topic: t.topic,
        accuracy: Math.round(t.accuracy),
        questionsAttempted: t.totalAttempted,
        incorrectCount: t.incorrect,
        weaknessScore: t.weaknessScore,
        recommendedPracticeCount: this.calculateRecommendedCount(t.weaknessScore),
      }))
      .sort((a, b) => b.weaknessScore - a.weaknessScore);
  }

  async getTopicAnalytics(userId: string = 'default-user'): Promise<TopicAnalytics[]> {
    const records = await this.db
      .select({
        subjectName: schema.performanceRecords.subjectName,
        topicName: schema.performanceRecords.topicName,
        totalAttempts: sql<number>`SUM(${schema.performanceRecords.totalAttempts})`,
        correctAttempts: sql<number>`SUM(${schema.performanceRecords.correctAttempts})`,
        incorrectAttempts: sql<number>`SUM(${schema.performanceRecords.incorrectAttempts})`,
        avgTime: sql<number>`AVG(${schema.performanceRecords.averageTimeMs})`,
      })
      .from(schema.performanceRecords)
      .where(
        sql`${schema.performanceRecords.userId} = ${userId} AND ${schema.performanceRecords.topicName} IS NOT NULL`
      )
      .groupBy(schema.performanceRecords.subjectName, schema.performanceRecords.topicName);

    return records.map((r) => {
      const attempted = r.correctAttempts + r.incorrectAttempts;
      const accuracy = attempted > 0 ? (r.correctAttempts / attempted) * 100 : 0;
      const isWeak = accuracy < WEAK_TOPIC_THRESHOLD;
      
      // Weakness score: combination of low accuracy and high volume of incorrect
      // Scale 0-100. Lower accuracy = higher score. More incorrect = higher score.
      const accuracyFactor = Math.max(0, 100 - accuracy); // 0-100
      const volumeFactor = Math.min(50, r.incorrectAttempts * 2); // Cap volume contribution
      
      let weaknessScore = (accuracyFactor * 0.7) + (volumeFactor * 0.3);
      if (!isWeak) weaknessScore = 0;

      return {
        subject: r.subjectName,
        topic: r.topicName!,
        totalAttempted: attempted,
        correct: r.correctAttempts,
        incorrect: r.incorrectAttempts,
        accuracy,
        averageTimeMs: Math.round(r.avgTime),
        isWeak,
        weaknessScore: Math.round(weaknessScore),
      };
    });
  }

  private calculateRecommendedCount(weaknessScore: number): number {
    if (weaknessScore > 80) return 30;
    if (weaknessScore > 60) return 25;
    if (weaknessScore > 40) return 20;
    return 15;
  }
}
