// ─── Source Types ──────────────────────────────────────────────────────────────
export type QuestionSourceType =
  | 'PYQ'           // Official Previous Year Question
  | 'USER_IMPORTED' // User uploaded from a source
  | 'ORIGINAL'      // Original practice question created for this platform
  | 'ONLINE_LICENSED' // From openly licensed online source
  | 'UNVERIFIED';   // Source unknown or unconfirmed

// ─── Verification Status ───────────────────────────────────────────────────────
export type VerificationStatus =
  | 'VERIFIED'      // Fully verified — answer confirmed, text clean
  | 'NEEDS_REVIEW'  // Flagged — low confidence, needs human check
  | 'UNVERIFIED'    // Not yet reviewed
  | 'REJECTED';     // Rejected — not usable

// ─── Difficulty ─────────────────────────────────────────────────────────────────
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

// ─── Language ───────────────────────────────────────────────────────────────────
export type QuestionLanguage = 'ENGLISH' | 'HINDI' | 'BILINGUAL';

// ─── Question Option ────────────────────────────────────────────────────────────
export interface QuestionOption {
  index: number;   // 0 = A, 1 = B, 2 = C, 3 = D
  text: string;
  imageUrl?: string;
}

// ─── Confidence Scores ──────────────────────────────────────────────────────────
export interface ConfidenceScores {
  questionExtraction: number;  // 0–100
  answerMapping: number;       // 0–100
  classification: number;      // 0–100
}

// ─── Question ───────────────────────────────────────────────────────────────────
export interface Question {
  id: string;
  questionText: string;
  originalQuestionText?: string;  // Preserved from PDF verbatim
  options: QuestionOption[];
  correctAnswer: number;          // 0-based index (0=A, 1=B, 2=C, 3=D)
  explanation?: string;

  // Classification
  subject: string;
  chapter?: string;
  topic?: string;
  subtopic?: string;
  difficulty: DifficultyLevel;
  tags: string[];

  // Source / Provenance
  sourceType: QuestionSourceType;
  sourceName?: string;
  sourceUrl?: string;
  examName?: string;
  examYear?: number;
  examShift?: string;
  licenseInfo?: string;

  // Images
  questionImageUrl?: string;
  optionImageUrls?: string[];

  // Language
  language: QuestionLanguage;

  // Metadata
  verificationStatus: VerificationStatus;
  confidence?: ConfidenceScores;
  importId?: string;
  pdfPageNumber?: number;
  questionNumberInSource?: number;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  editedBy?: string;
  editedAt?: string;
  answerManuallyVerified?: boolean;
}

// ─── Question Summary (for list views) ──────────────────────────────────────────
export interface QuestionSummary {
  id: string;
  questionText: string;
  subject: string;
  topic?: string;
  difficulty: DifficultyLevel;
  sourceName?: string;
  examYear?: number;
  verificationStatus: VerificationStatus;
  correctAnswer: number;
}

// ─── Question Source ─────────────────────────────────────────────────────────────
export interface QuestionSource {
  id: string;
  name: string;
  type: QuestionSourceType;
  examName?: string;
  examYear?: number;
  examShift?: string;
  fileName?: string;
  totalPages?: number;
  licenseInfo?: string;
  sourceUrl?: string;
  importedAt: string;
  questionCount: number;
}

// ─── Question History (user-specific performance on a question) ──────────────────
export interface QuestionHistory {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  averageTimeMs: number;
  lastAttemptedAt?: string;
  lastResult?: 'CORRECT' | 'INCORRECT' | 'SKIPPED';
  testsUsedIn: number;
}
