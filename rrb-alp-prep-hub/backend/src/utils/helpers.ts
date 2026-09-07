import { nanoid } from 'nanoid';

/**
 * Generate a human-readable question ID
 * Format: ALP-{SUBJ}-{YEAR}-{seq}
 * e.g.: ALP-MATH-2025-A3k9
 */
export function generateQuestionId(subject?: string, year?: number): string {
  const subj = subject ? subject.slice(0, 4).toUpperCase() : 'GEN';
  const yr = year ?? new Date().getFullYear();
  const suffix = nanoid(6).toUpperCase();
  return `ALP-${subj}-${yr}-${suffix}`;
}

export function generateId(): string {
  return nanoid();
}

/**
 * Normalize text for duplicate detection:
 * lowercase, remove extra spaces, remove punctuation
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // replace punctuation with space
    .replace(/\s+/g, ' ')       // collapse multiple spaces
    .trim();
}

/**
 * Levenshtein distance (for near-duplicate detection)
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Similarity ratio (0–1) between two strings
 */
export function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Parse a JSON string safely — return defaultValue on error
 */
export function safeJsonParse<T>(json: string | null | undefined, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Format seconds as "MM:SS"
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
