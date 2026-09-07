// ─── Exam Configuration ──────────────────────────────────────────────────────────
export interface ExamConfiguration {
  id: string;
  name: string;
  description?: string;
  durationSeconds: number;         // 3600 = 60 minutes
  totalQuestions: number;          // 75
  marksPerCorrect: number;         // 1
  negativeMarksPerWrong: number;   // 0.333...
  sections?: ExamSection[];
  languageOptions: string[];       // ['ENGLISH', 'HINDI']
  isDefault: boolean;
  createdAt: string;
}

// ─── Exam Section ──────────────────────────────────────────────────────────────
export interface ExamSection {
  id: string;
  name: string;
  subject?: string;
  questionCount: number;
  marksPerCorrect?: number;
  negativeMarksPerWrong?: number;
}

// ─── Test Type ──────────────────────────────────────────────────────────────────
export type TestType =
  | 'FULL_MOCK'
  | 'SUBJECT_TEST'
  | 'TOPIC_TEST'
  | 'MIXED_TEST'
  | 'WEAK_AREA_TEST'
  | 'CUSTOM_TEST';

// ─── Test Generation Request ─────────────────────────────────────────────────────
export interface TestGenerationRequest {
  testType: TestType;
  name?: string;
  totalQuestions: number;
  durationSeconds: number;

  // Filters
  subjects?: string[];
  topics?: string[];
  subtopics?: string[];
  difficulty?: {
    EASY?: number;   // percentage
    MEDIUM?: number;
    HARD?: number;
  };
  sourceTypes?: string[];
  examYears?: number[];

  // Repeat policy
  excludeAttemptedInLastN?: number;  // exclude questions from last N attempts
  prioritizeWeak?: boolean;          // weight by weak topic engine
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;

  // Config reference
  examConfigId?: string;
}

// ─── Test Session ─────────────────────────────────────────────────────────────
export interface TestSession {
  id: string;
  name: string;
  testType: TestType;
  examConfigId?: string;

  // Question set
  questionIds: string[];
  totalQuestions: number;

  // Timing
  durationSeconds: number;
  createdAt: string;

  // Generation params (for provenance)
  generationRequest: TestGenerationRequest;
}

// ─── Test Attempt State (live, in-progress) ──────────────────────────────────
export interface TestAttemptState {
  attemptId: string;
  sessionId: string;

  // Answers: questionId → selected option index (null = unanswered)
  answers: Record<string, number | null>;

  // Navigation
  currentQuestionIndex: number;
  visitedQuestions: Set<string>;
  markedForReview: Set<string>;

  // Timing
  startedAt: number;   // Unix timestamp ms
  endTime: number;     // Unix timestamp ms (startedAt + durationMs)
  questionTimings: Record<string, QuestionTiming>;

  // State
  isSubmitted: boolean;
  autoSubmitted?: boolean;
}

// ─── Question Timing ─────────────────────────────────────────────────────────
export interface QuestionTiming {
  questionId: string;
  firstOpenedAt?: number;
  lastOpenedAt?: number;
  totalTimeMs: number;
  answerChanges: number;
}

// ─── Test Attempt Record (saved) ─────────────────────────────────────────────
export interface TestAttemptRecord {
  id: string;
  sessionId: string;
  testType: TestType;
  testName: string;

  // Submission
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  autoSubmitted: boolean;

  // Score
  score: ScoreResult;

  // Per-question breakdown
  questionAttempts: QuestionAttemptRecord[];
}

// ─── Score Result ─────────────────────────────────────────────────────────────
export interface ScoreResult {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;

  positiveMarks: number;
  negativeMarks: number;
  finalScore: number;
  maxPossibleScore: number;

  accuracy: number;         // % of attempted that were correct
  attemptRate: number;      // % of total that were attempted
  totalTimeMs: number;
  averageTimePerQuestionMs: number;

  // Per-subject breakdown
  subjectBreakdown?: SubjectScore[];
}

// ─── Subject Score ────────────────────────────────────────────────────────────
export interface SubjectScore {
  subject: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
  accuracy: number;
}

// ─── Question Attempt Record ──────────────────────────────────────────────────
export interface QuestionAttemptRecord {
  questionId: string;
  selectedAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  wasAttempted: boolean;
  wasMarkedForReview: boolean;
  timeSpentMs: number;

  // Denormalized for review
  questionText?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
}
