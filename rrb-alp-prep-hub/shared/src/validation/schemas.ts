import { z } from 'zod';

// ─── Question Schemas ──────────────────────────────────────────────────────────
export const QuestionOptionSchema = z.object({
  index: z.number().int().min(0).max(3),
  text: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

export const CreateQuestionSchema = z.object({
  questionText: z.string().min(3, 'Question text is too short'),
  options: z.array(QuestionOptionSchema).min(2).max(4),
  correctAnswer: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
  subject: z.string().min(1),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  subtopic: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  tags: z.array(z.string()).default([]),
  sourceType: z.enum(['PYQ', 'USER_IMPORTED', 'ORIGINAL', 'ONLINE_LICENSED', 'UNVERIFIED']),
  sourceName: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  examName: z.string().optional(),
  examYear: z.number().int().min(1990).max(2100).optional(),
  examShift: z.string().optional(),
  language: z.enum(['ENGLISH', 'HINDI', 'BILINGUAL']).default('ENGLISH'),
  questionImageUrl: z.string().url().optional(),
  importId: z.string().optional(),
  pdfPageNumber: z.number().int().min(1).optional(),
  questionNumberInSource: z.number().int().min(1).optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial().extend({
  verificationStatus: z.enum(['VERIFIED', 'NEEDS_REVIEW', 'UNVERIFIED', 'REJECTED']).optional(),
  answerManuallyVerified: z.boolean().optional(),
});

// ─── Test Generation Schemas ──────────────────────────────────────────────────
export const TestGenerationSchema = z.object({
  testType: z.enum(['FULL_MOCK', 'SUBJECT_TEST', 'TOPIC_TEST', 'MIXED_TEST', 'WEAK_AREA_TEST', 'CUSTOM_TEST']),
  name: z.string().optional(),
  totalQuestions: z.number().int().min(5).max(200),
  durationSeconds: z.number().int().min(60).max(14400),
  subjects: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  subtopics: z.array(z.string()).optional(),
  difficulty: z.object({
    EASY: z.number().min(0).max(100).optional(),
    MEDIUM: z.number().min(0).max(100).optional(),
    HARD: z.number().min(0).max(100).optional(),
  }).optional(),
  sourceTypes: z.array(z.string()).optional(),
  examYears: z.array(z.number().int()).optional(),
  excludeAttemptedInLastN: z.number().int().min(0).optional(),
  prioritizeWeak: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(false),
  examConfigId: z.string().optional(),
});

// ─── Attempt Submission Schema ────────────────────────────────────────────────
export const SubmitAttemptSchema = z.object({
  sessionId: z.string(),
  answers: z.record(z.string(), z.number().nullable()),
  questionTimings: z.record(z.string(), z.object({
    questionId: z.string(),
    totalTimeMs: z.number().min(0),
    answerChanges: z.number().min(0),
  })),
  markedForReview: z.array(z.string()),
  startedAt: z.number(),
  submittedAt: z.number(),
  autoSubmitted: z.boolean().default(false),
});

// ─── Import Review Action Schema ───────────────────────────────────────────────
export const ImportReviewActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SAVE']),
  questionData: UpdateQuestionSchema.optional(),
});

// ─── Filter / Search Schema ───────────────────────────────────────────────────
export const QuestionFilterSchema = z.object({
  search: z.string().optional(),
  subject: z.string().optional(),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  sourceType: z.string().optional(),
  examYear: z.number().int().optional(),
  verificationStatus: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Settings Schema ──────────────────────────────────────────────────────────
export const UserSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  defaultExamConfigId: z.string().optional(),
  defaultLanguage: z.enum(['ENGLISH', 'HINDI']).default('ENGLISH'),
  showExplanationAfterEach: z.boolean().default(false),
  autoSaveInterval: z.number().int().min(5).max(60).default(15), // seconds
  weakTopicThreshold: z.number().min(10).max(90).default(60),    // %
});
