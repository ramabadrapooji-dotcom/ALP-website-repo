// ─── Analytics Overview ───────────────────────────────────────────────────────
export interface AnalyticsOverview {
  userId?: string;
  totalTests: number;
  totalQuestionsAttempted: number;
  averageScore: number;        // absolute score
  bestScore: number;
  averageAccuracy: number;     // percentage
  bestAccuracy: number;
  currentStreak: number;       // consecutive days practiced
  lastAttemptedAt?: string;
  averageTimePerQuestionMs: number;
}

// ─── Score Trend Point ────────────────────────────────────────────────────────
export interface ScoreTrendPoint {
  attemptId: string;
  testName: string;
  date: string;
  score: number;
  maxScore: number;
  accuracy: number;
  testType: string;
}

// ─── Subject Analytics ────────────────────────────────────────────────────────
export interface SubjectAnalytics {
  subject: string;
  totalAttempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  averageTimeMs: number;
  testsCount: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE' | 'INSUFFICIENT_DATA';
}

// ─── Topic Analytics ──────────────────────────────────────────────────────────
export interface TopicAnalytics {
  subject: string;
  topic: string;
  totalAttempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  averageTimeMs: number;
  isWeak: boolean;           // true if accuracy < weakThreshold
  weaknessScore: number;     // 0–100, higher = weaker
}

// ─── Weak Topic ───────────────────────────────────────────────────────────────
export interface WeakTopic {
  subject: string;
  topic: string;
  accuracy: number;
  questionsAttempted: number;
  incorrectCount: number;
  weaknessScore: number;
  recommendedPracticeCount: number;
}

// ─── Time Analytics ───────────────────────────────────────────────────────────
export interface TimeAnalytics {
  averagePerQuestion: number;
  fastestSubject: string;
  slowestSubject: string;
  subjectTimes: Record<string, number>;  // subject → avg ms
  topicTimes: Record<string, number>;    // topic → avg ms
}

// ─── Analytics Response (full) ────────────────────────────────────────────────
export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  scoreTrend: ScoreTrendPoint[];
  subjects: SubjectAnalytics[];
  topics: TopicAnalytics[];
  weakTopics: WeakTopic[];
  timeAnalytics: TimeAnalytics;
  insights: string[];  // data-backed insight strings
}
