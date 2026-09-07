import { logger } from '../utils/logger';

export interface AnswerKeyEntry {
  questionNumber: number;
  answerLabel: string;   // 'A', 'B', 'C', 'D' (normalized to uppercase)
  answerIndex: number;   // 0-based: A=0, B=1, C=2, D=3
}

export interface AnswerKeyParseResult {
  entries: Map<number, AnswerKeyEntry>;
  totalFound: number;
  format: string;
  confidence: number;
}

// Answer key section markers
const ANSWER_KEY_MARKERS = [
  /answer\s*key/i,
  /answers?\s*:/i,
  /correct\s*answers?/i,
  /solutions?\s*:/i,
  /उत्तर\s*कुंजी/,  // Hindi: Uttar Kunji
];

// Supported formats:
// "1 - B" | "1- B" | "1-B" | "1. B" | "1) B" | "1 B"
// Also: "1 (B)" | "Ans. 1: B"
const ANSWER_LINE_PATTERNS = [
  /^(\d{1,3})\s*[-–.):]\s*([ABCDabcd1-4])\b/,    // 1-B | 1. B | 1) B
  /^(\d{1,3})\s+([ABCDabcd1-4])\b/,               // 1 B
  /^(\d{1,3})\s*\(([ABCDabcd1-4])\)/,             // 1 (B)
  /^Ans\.?\s*(\d{1,3})\s*[:-]\s*([ABCDabcd1-4])\b/i, // Ans. 1: B
];

const LABEL_TO_INDEX: Record<string, number> = {
  a: 0, '1': 0,
  b: 1, '2': 1,
  c: 2, '3': 2,
  d: 3, '4': 3,
};

/**
 * Parse the answer key from a PDF text.
 * Finds the answer key section and extracts question→answer mappings.
 */
export function parseAnswerKey(fullText: string): AnswerKeyParseResult {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
  const entries = new Map<number, AnswerKeyEntry>();

  let answerKeyStartIndex = -1;
  let format = 'unknown';

  // 1. Find the answer key section
  for (let i = 0; i < lines.length; i++) {
    if (ANSWER_KEY_MARKERS.some((m) => m.test(lines[i]))) {
      answerKeyStartIndex = i;
      break;
    }
  }

  // 2. If no explicit marker, try to find a block of answer-like lines
  if (answerKeyStartIndex === -1) {
    answerKeyStartIndex = findAnswerKeyByDensity(lines);
  }

  if (answerKeyStartIndex === -1) {
    logger.warn('Answer key section not found in PDF');
    return { entries, totalFound: 0, format: 'not-found', confidence: 0 };
  }

  // 3. Parse entries from the answer key section
  let detectedFormat = '';
  for (let i = answerKeyStartIndex; i < lines.length; i++) {
    const line = lines[i];

    // Stop if we hit another section
    if (i > answerKeyStartIndex + 5 && /^\d+\.\s+[A-Za-z]/.test(line)) {
      // Looks like questions started again
      break;
    }

    // Try each pattern
    for (const pattern of ANSWER_LINE_PATTERNS) {
      const m = line.match(pattern);
      if (m) {
        const qNum = parseInt(m[1], 10);
        const rawLabel = m[2].toLowerCase();
        const answerIndex = LABEL_TO_INDEX[rawLabel];

        if (!isNaN(qNum) && qNum >= 1 && qNum <= 300 && answerIndex !== undefined) {
          const answerLabel = rawLabel === '1' ? 'A'
            : rawLabel === '2' ? 'B'
            : rawLabel === '3' ? 'C'
            : rawLabel === '4' ? 'D'
            : rawLabel.toUpperCase();

          entries.set(qNum, { questionNumber: qNum, answerLabel, answerIndex });
          if (!detectedFormat) detectedFormat = pattern.toString().slice(1, 20);
          break;
        }
      }
    }

    // Also try to parse table-format rows: "1  A  2  B  3  C  4  D ..."
    const tableMatches = parseTableRow(line);
    for (const entry of tableMatches) {
      if (!entries.has(entry.questionNumber)) {
        entries.set(entry.questionNumber, entry);
        detectedFormat = 'table';
      }
    }
  }

  format = detectedFormat || 'sequential';
  const confidence = entries.size > 0 ? Math.min(95, 60 + entries.size) : 0;

  logger.info(`Answer key parsed: ${entries.size} entries found (format: ${format})`);

  return {
    entries,
    totalFound: entries.size,
    format,
    confidence,
  };
}

/**
 * Find answer key section by looking for a dense block of "N X" patterns
 */
function findAnswerKeyByDensity(lines: string[]): number {
  let bestStart = -1;
  let bestCount = 0;

  for (let i = 0; i < lines.length - 5; i++) {
    let count = 0;
    for (let j = i; j < Math.min(i + 15, lines.length); j++) {
      if (ANSWER_LINE_PATTERNS.some((p) => p.test(lines[j])) || parseTableRow(lines[j]).length > 0) {
        count++;
      }
    }
    if (count > bestCount && count >= 5) {
      bestCount = count;
      bestStart = i;
    }
  }

  return bestStart;
}

/**
 * Parse table-format answer rows like "1 A  2 B  3 C  4 D"
 */
function parseTableRow(line: string): AnswerKeyEntry[] {
  const entries: AnswerKeyEntry[] = [];
  const pattern = /(\d{1,3})\s+([ABCDabcd])/g;
  let m;
  while ((m = pattern.exec(line)) !== null) {
    const qNum = parseInt(m[1], 10);
    const rawLabel = m[2].toLowerCase();
    const answerIndex = LABEL_TO_INDEX[rawLabel];
    if (!isNaN(qNum) && qNum >= 1 && qNum <= 300 && answerIndex !== undefined) {
      entries.push({
        questionNumber: qNum,
        answerLabel: rawLabel.toUpperCase(),
        answerIndex,
      });
    }
  }
  return entries;
}
