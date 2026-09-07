import { Router } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { WeakTopicService } from '../services/weakTopicService';

const router = Router();
const analyticsService = new AnalyticsService();
const weakTopicService = new WeakTopicService();

router.get('/', async (req, res, next) => {
  try {
    const userId = 'default-user';
    const [overview, scoreTrend, subjects, topics, weakTopics] = await Promise.all([
      analyticsService.getOverview(userId),
      analyticsService.getScoreTrend(userId),
      analyticsService.getSubjectAnalytics(userId),
      weakTopicService.getTopicAnalytics(userId),
      weakTopicService.getWeakTopics(userId),
    ]);

    // Construct simple time analytics from topics
    const avgTimes = topics.filter(t => t.totalAttempted > 0).map(t => t.averageTimeMs);
    const avgOverall = avgTimes.length > 0 ? avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length : 0;
    
    let fastestSubject = '';
    let slowestSubject = '';
    let minT = Infinity;
    let maxT = -1;
    
    const subjectTimes: Record<string, number> = {};
    for (const sub of subjects) {
      subjectTimes[sub.subject] = sub.averageTimeMs;
      if (sub.totalAttempted > 0) {
        if (sub.averageTimeMs < minT) { minT = sub.averageTimeMs; fastestSubject = sub.subject; }
        if (sub.averageTimeMs > maxT) { maxT = sub.averageTimeMs; slowestSubject = sub.subject; }
      }
    }

    const timeAnalytics = {
      averagePerQuestion: Math.round(avgOverall),
      fastestSubject,
      slowestSubject,
      subjectTimes,
      topicTimes: Object.fromEntries(topics.map(t => [t.topic, t.averageTimeMs])),
    };

    res.json({
      success: true,
      data: {
        overview,
        scoreTrend,
        subjects,
        topics,
        weakTopics,
        timeAnalytics,
        insights: [
          `You have completed ${overview.totalTests} practice tests.`,
          weakTopics.length > 0 ? `Your weakest topic is ${weakTopics[0].topic} in ${weakTopics[0].subject}.` : 'Keep practicing to discover your weak topics.',
          fastestSubject ? `You are fastest at ${fastestSubject}.` : '',
        ].filter(Boolean)
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
