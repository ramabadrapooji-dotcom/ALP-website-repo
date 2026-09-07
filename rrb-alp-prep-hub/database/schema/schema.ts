import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Helper: timestamp columns ─────────────────────────────────────────────────
const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
};

// ─── users ─────────────────────────────────────────────────────────────────────
// Single-user initially; auth-ready structure
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('Learner'),
  email: text('email'),
  passwordHash: text('password_hash'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
});

// ─── subjects ──────────────────────────────────────────────────────────────────
export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  shortCode: text('short_code').notNull(),
  color: text('color'),
  icon: text('icon'),
  displayOrder: integer('display_order').notNull().default(0),
  ...timestamps,
});

// ─── chapters ──────────────────────────────────────────────────────────────────
export const chapters = sqliteTable('chapters', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  ...timestamps,
});

// ─── topics ────────────────────────────────────────────────────────────────────
export const topics = sqliteTable('topics', {
  id: text('id').primaryKey(),
  chapterId: text('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  ...timestamps,
});

// ─── subtopics ─────────────────────────────────────────────────────────────────
export const subtopics = sqliteTable('subtopics', {
  id: text('id').primaryKey(),
  topicId: text('topic_id')
    .notNull()
    .references(() => topics.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  ...timestamps,
});

// ─── question_sources ──────────────────────────────────────────────────────────
// Represents a PDF file or online source
export const questionSources = sqliteTable('question_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sourceType: text('source_type').notNull(), // PYQ | USER_IMPORTED | ORIGINAL | ONLINE_LICENSED | UNVERIFIED
  examName: text('exam_name'),
  examYear: integer('exam_year'),
  examShift: text('exam_shift'),
  fileName: text('file_name'),
  filePath: text('file_path'),
  totalPages: integer('total_pages'),
  licenseInfo: text('license_info'),
  sourceUrl: text('source_url'),
  importId: text('import_id'),
  ...timestamps,
});

// ─── pdf_imports ───────────────────────────────────────────────────────────────
// Tracks every PDF import job
export const pdfImports = sqliteTable('pdf_imports', {
  id: text('id').primaryKey(),
  fileName: text('file_name').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  filePath: text('file_path'),
  examName: text('exam_name'),
  examYear: integer('exam_year'),
  examShift: text('exam_shift'),
  status: text('status').notNull().default('PENDING'), // PENDING | PROCESSING | NEEDS_REVIEW | COMPLETED | FAILED
  errorMessage: text('error_message'),
  report: text('report'), // JSON string of ImportReport
  processingTimeMs: integer('processing_time_ms'),
  completedAt: text('completed_at'),
  ...timestamps,
});

// ─── pdf_pages ─────────────────────────────────────────────────────────────────
export const pdfPages = sqliteTable('pdf_pages', {
  id: text('id').primaryKey(),
  importId: text('import_id')
    .notNull()
    .references(() => pdfImports.id, { onDelete: 'cascade' }),
  pageNumber: integer('page_number').notNull(),
  hasTextLayer: integer('has_text_layer', { mode: 'boolean' }).notNull().default(true),
  usedOcr: integer('used_ocr', { mode: 'boolean' }).notNull().default(false),
  extractedText: text('extracted_text'),
  ocrConfidence: real('ocr_confidence'),
  questionsOnPage: text('questions_on_page'), // JSON: number[]
  ...timestamps,
});

// ─── questions ─────────────────────────────────────────────────────────────────
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),

  // Content
  questionText: text('question_text').notNull(),
  originalQuestionText: text('original_question_text'), // verbatim from PDF
  explanation: text('explanation'),

  // Classification
  subjectId: text('subject_id').references(() => subjects.id),
  chapterId: text('chapter_id').references(() => chapters.id),
  topicId: text('topic_id').references(() => topics.id),
  subtopicId: text('subtopic_id').references(() => subtopics.id),

  // Denormalized for quick filtering (no join needed)
  subjectName: text('subject_name'),
  chapterName: text('chapter_name'),
  topicName: text('topic_name'),
  subtopicName: text('subtopic_name'),

  difficulty: text('difficulty').notNull().default('MEDIUM'), // EASY | MEDIUM | HARD
  tags: text('tags').notNull().default('[]'), // JSON string array
  language: text('language').notNull().default('ENGLISH'),

  // Answer
  correctAnswer: integer('correct_answer').notNull(), // 0-based index

  // Source / Provenance
  sourceType: text('source_type').notNull().default('UNVERIFIED'),
  sourceId: text('source_id').references(() => questionSources.id),
  importId: text('import_id').references(() => pdfImports.id),
  sourceName: text('source_name'),
  sourceUrl: text('source_url'),
  examName: text('exam_name'),
  examYear: integer('exam_year'),
  examShift: text('exam_shift'),
  licenseInfo: text('license_info'),

  // Images
  questionImageUrl: text('question_image_url'),
  optionImageUrls: text('option_image_urls'), // JSON string array

  // Import metadata
  pdfPageNumber: integer('pdf_page_number'),
  questionNumberInSource: integer('question_number_in_source'),

  // Verification
  verificationStatus: text('verification_status').notNull().default('UNVERIFIED'),
  extractionConfidence: real('extraction_confidence'),
  answerMappingConfidence: real('answer_mapping_confidence'),
  classificationConfidence: real('classification_confidence'),
  answerManuallyVerified: integer('answer_manually_verified', { mode: 'boolean' }).default(false),

  // Audit
  createdBy: text('created_by'),
  editedBy: text('edited_by'),
  editedAt: text('edited_at'),

  ...timestamps,
});

// ─── question_options ──────────────────────────────────────────────────────────
export const questionOptions = sqliteTable('question_options', {
  id: text('id').primaryKey(),
  questionId: text('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  optionIndex: integer('option_index').notNull(), // 0 = A, 1 = B, 2 = C, 3 = D
  optionText: text('option_text').notNull(),
  imageUrl: text('image_url'),
});

// ─── exam_configurations ───────────────────────────────────────────────────────
export const examConfigurations = sqliteTable('exam_configurations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  durationSeconds: integer('duration_seconds').notNull().default(3600),
  totalQuestions: integer('total_questions').notNull().default(75),
  marksPerCorrect: real('marks_per_correct').notNull().default(1),
  negativeMarksPerWrong: real('negative_marks_per_wrong').notNull().default(0.333),
  sections: text('sections'), // JSON string
  languageOptions: text('language_options').notNull().default('["ENGLISH","HINDI"]'), // JSON
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
});

// ─── test_sessions ─────────────────────────────────────────────────────────────
// A generated test (question set + config)
export const testSessions = sqliteTable('test_sessions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  testType: text('test_type').notNull(), // FULL_MOCK | SUBJECT_TEST | ...
  examConfigId: text('exam_config_id').references(() => examConfigurations.id),
  totalQuestions: integer('total_questions').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  questionIds: text('question_ids').notNull(), // JSON string: string[]
  generationRequest: text('generation_request'), // JSON string
  ...timestamps,
});

// ─── test_attempts ─────────────────────────────────────────────────────────────
// A user's attempt at a test_session
export const testAttempts = sqliteTable('test_attempts', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => testSessions.id),
  userId: text('user_id').references(() => users.id),
  testType: text('test_type').notNull(),
  testName: text('test_name').notNull(),

  // Status
  status: text('status').notNull().default('IN_PROGRESS'), // IN_PROGRESS | SUBMITTED | ABANDONED
  autoSubmitted: integer('auto_submitted', { mode: 'boolean' }).default(false),

  // Timing
  startedAt: text('started_at').notNull(),
  submittedAt: text('submitted_at'),
  durationSeconds: integer('duration_seconds').notNull(),
  totalTimeUsedMs: integer('total_time_used_ms'),

  // Score (denormalized for quick access)
  totalQuestions: integer('total_questions').notNull(),
  attempted: integer('attempted').notNull().default(0),
  correct: integer('correct').notNull().default(0),
  incorrect: integer('incorrect').notNull().default(0),
  unattempted: integer('unattempted').notNull().default(0),
  positiveMarks: real('positive_marks').notNull().default(0),
  negativeMarks: real('negative_marks').notNull().default(0),
  finalScore: real('final_score').notNull().default(0),
  maxPossibleScore: real('max_possible_score').notNull().default(0),
  accuracy: real('accuracy').notNull().default(0),
  attemptRate: real('attempt_rate').notNull().default(0),

  // Full score breakdown (JSON)
  scoreJson: text('score_json'),

  ...timestamps,
});

// ─── question_attempts ─────────────────────────────────────────────────────────
// One row per question per attempt
export const questionAttempts = sqliteTable('question_attempts', {
  id: text('id').primaryKey(),
  attemptId: text('attempt_id')
    .notNull()
    .references(() => testAttempts.id, { onDelete: 'cascade' }),
  questionId: text('question_id')
    .notNull()
    .references(() => questions.id),
  userId: text('user_id').references(() => users.id),

  selectedAnswer: integer('selected_answer'), // null = unanswered
  correctAnswer: integer('correct_answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  wasAttempted: integer('was_attempted', { mode: 'boolean' }).notNull().default(false),
  wasMarkedForReview: integer('was_marked_for_review', { mode: 'boolean' }).default(false),

  // Time tracking
  firstOpenedAt: text('first_opened_at'),
  lastOpenedAt: text('last_opened_at'),
  timeSpentMs: integer('time_spent_ms').notNull().default(0),
  answerChanges: integer('answer_changes').notNull().default(0),

  // Denormalized for analytics (avoid join for perf)
  subjectName: text('subject_name'),
  topicName: text('topic_name'),
  difficulty: text('difficulty'),

  ...timestamps,
});

// ─── performance_records ───────────────────────────────────────────────────────
// Aggregated per-topic performance (updated after each attempt)
export const performanceRecords = sqliteTable('performance_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  questionId: text('question_id').references(() => questions.id),
  subjectName: text('subject_name').notNull(),
  topicName: text('topic_name'),

  totalAttempts: integer('total_attempts').notNull().default(0),
  correctAttempts: integer('correct_attempts').notNull().default(0),
  incorrectAttempts: integer('incorrect_attempts').notNull().default(0),
  averageTimeMs: real('average_time_ms').notNull().default(0),
  lastAttemptedAt: text('last_attempted_at'),
  lastResult: text('last_result'), // CORRECT | INCORRECT | SKIPPED
  testsUsedIn: integer('tests_used_in').notNull().default(0),

  ...timestamps,
});

// ─── user_settings ─────────────────────────────────────────────────────────────
export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  theme: text('theme').notNull().default('dark'),
  defaultExamConfigId: text('default_exam_config_id'),
  defaultLanguage: text('default_language').notNull().default('ENGLISH'),
  showExplanationAfterEach: integer('show_explanation_after_each', { mode: 'boolean' }).default(false),
  autoSaveInterval: integer('auto_save_interval').notNull().default(15),
  weakTopicThreshold: real('weak_topic_threshold').notNull().default(60),
  ...timestamps,
});

// ─── Type exports (for TypeScript inference) ─────────────────────────────────
export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Subtopic = typeof subtopics.$inferSelect;
export type QuestionSource = typeof questionSources.$inferSelect;
export type PdfImport = typeof pdfImports.$inferSelect;
export type PdfPage = typeof pdfPages.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type ExamConfiguration = typeof examConfigurations.$inferSelect;
export type TestSession = typeof testSessions.$inferSelect;
export type TestAttempt = typeof testAttempts.$inferSelect;
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type PerformanceRecord = typeof performanceRecords.$inferSelect;
export type UserSetting = typeof userSettings.$inferSelect;
