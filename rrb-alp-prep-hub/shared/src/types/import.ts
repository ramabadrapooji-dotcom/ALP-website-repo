// ─── PDF Import Status ────────────────────────────────────────────────────────
export type ImportStepStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR' | 'SKIPPED';

export interface ImportStep {
  id: string;
  label: string;
  status: ImportStepStatus;
  detail?: string;
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

export type ImportStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'NEEDS_REVIEW'
  | 'COMPLETED'
  | 'FAILED';

// ─── Import Job ───────────────────────────────────────────────────────────────
export interface ImportJob {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  examName?: string;
  examYear?: number;
  examShift?: string;
  status: ImportStatus;
  createdAt: string;
  completedAt?: string;
  report?: ImportReport;
  errorMessage?: string;
}

// ─── Import Report ────────────────────────────────────────────────────────────
export interface ImportReport {
  importId: string;
  fileName: string;
  examName?: string;
  examYear?: number;
  examShift?: string;

  // Pages
  totalPages: number;
  pagesWithText: number;
  pagesWithOCR: number;

  // Questions
  questionsDetected: number;
  questionsParsed: number;
  answersMatched: number;
  questionsVerified: number;
  questionsNeedingReview: number;
  questionsRejected: number;

  // Duplicates
  exactDuplicates: number;
  nearDuplicates: number;

  // Classification
  classifiedSuccessfully: number;
  classificationFailed: number;

  // Problematic question IDs
  needsReviewIds: string[];
  failedIds: string[];
  duplicateIds: string[];

  processingTimeMs: number;
}

// ─── Extracted Raw Question (before DB save) ─────────────────────────────────
export interface ExtractedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  detectedAnswer?: number;   // 0-based index
  answerLabel?: string;      // 'A', 'B', 'C', 'D' or '1','2','3','4'
  pageNumbers: number[];
  extractionConfidence: number;
  answerMappingConfidence: number;
  classificationConfidence: number;
  detectedSubject?: string;
  detectedTopic?: string;
  imageUrls?: string[];
  rawText?: string;
}
