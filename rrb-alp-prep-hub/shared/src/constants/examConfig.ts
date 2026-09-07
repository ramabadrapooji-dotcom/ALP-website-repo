import type { ExamConfiguration } from '../types/exam';

// ─── Default RRB ALP CBT-1 Configuration ──────────────────────────────────────
export const RRB_ALP_CBT1_CONFIG: ExamConfiguration = {
  id: 'rrb-alp-cbt1-default',
  name: 'RRB ALP CBT-1 Full Mock',
  description: 'Standard RRB ALP CBT-1 pattern: 75 questions, 60 minutes',
  durationSeconds: 3600,        // 60 minutes
  totalQuestions: 75,
  marksPerCorrect: 1,
  negativeMarksPerWrong: 1 / 3, // 0.333...
  languageOptions: ['ENGLISH', 'HINDI'],
  sections: [
    { id: 'math', name: 'Mathematics', subject: 'Mathematics', questionCount: 20 },
    { id: 'reas', name: 'General Intelligence & Reasoning', subject: 'Reasoning', questionCount: 25 },
    { id: 'sci', name: 'General Science', questionCount: 20 },
    { id: 'gk', name: 'General Awareness', questionCount: 10 },
  ],
  isDefault: true,
  createdAt: new Date().toISOString(),
};

// ─── Quick Test Presets ────────────────────────────────────────────────────────
export const QUICK_TEST_PRESETS = [
  { label: '20 Questions', value: 20, durationSeconds: 20 * 60 },
  { label: '25 Questions', value: 25, durationSeconds: 25 * 60 },
  { label: '30 Questions', value: 30, durationSeconds: 30 * 60 },
  { label: '40 Questions', value: 40, durationSeconds: 40 * 60 },
  { label: '50 Questions', value: 50, durationSeconds: 50 * 60 },
  { label: '75 Questions (Full Mock)', value: 75, durationSeconds: 60 * 60 },
] as const;

// ─── Difficulty Presets ────────────────────────────────────────────────────────
export const DIFFICULTY_PRESETS = {
  BALANCED: { EASY: 30, MEDIUM: 50, HARD: 20 },
  EASY_FOCUS: { EASY: 60, MEDIUM: 30, HARD: 10 },
  HARD_FOCUS: { EASY: 10, MEDIUM: 30, HARD: 60 },
  UNIFORM: { EASY: 33, MEDIUM: 34, HARD: 33 },
} as const;

// ─── Timer Warning Thresholds (seconds remaining) ─────────────────────────────
export const TIMER_WARNINGS = {
  TEN_MINUTES: 600,
  FIVE_MINUTES: 300,
  ONE_MINUTE: 60,
} as const;

// ─── Confidence Thresholds ────────────────────────────────────────────────────
export const CONFIDENCE_THRESHOLDS = {
  VERIFIED: 90,      // >= 90% → VERIFIED
  NEEDS_REVIEW: 60,  // 60–89% → NEEDS_REVIEW
  UNVERIFIED: 0,     // < 60% → UNVERIFIED
} as const;

// ─── Weak Topic Threshold ─────────────────────────────────────────────────────
export const WEAK_TOPIC_THRESHOLD = 60; // accuracy % below which a topic is "weak"

// ─── Minimum Questions for Weak Topic Detection ───────────────────────────────
export const MIN_QUESTIONS_FOR_WEAK_DETECTION = 5;

// ─── Pagination ───────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// ─── File Upload Limits ───────────────────────────────────────────────────────
export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_MIME_TYPES = ['application/pdf'];
