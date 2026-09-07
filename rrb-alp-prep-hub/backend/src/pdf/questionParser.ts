import type { ExtractedQuestion } from '../../../shared/src/types/import';
import { logger } from '../utils/logger';

/**
 * Detects question start patterns in text.
 * Supports: 1. | 1) | Q1. | Q.1 | Q1 | Question 1
 */
const QUESTION_START_PATTERNS = [
  /^(?:Q(?:uestion)?\.?\s*)?(\d{1,3})[.)]\s+/i,   // 1. | 1) | Q1. | Q.1 | Question 1.
  /^(?:Q\.?)(\d{1,3})\s*[.):-]?\s+/i,              // Q1 | Q.1
];

/**
 * Option patterns: A. | A) | (A) | a. | a)
 */
const OPTION_PATTERNS = [
  /^([A-Da-d])[.)]\s+(.+)/,     // A. text | A) text
  /^\(([A-Da-d])\)\s+(.+)/i,    // (A) text
  /^([1-4])[.)]\s+(.+)/,        // 1. text (numeric options)
];

const OPTION_LABEL_TO_INDEX: Record<string, number> = {
  a: 0, '1': 0,
  b: 1, '2': 1,
  c: 2, '3': 2,
  d: 3, '4': 3,
};

export interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  pageNumbers: number[];
  extractionConfidence: number;
  rawLines: string[];
}

/**
 * Parse all questions from the full PDF text.
 * Handles multi-page questions by tracking context across pages.
 */
export function parseQuestions(
  pages: Array<{ pageNumber: number; text: string }>,
): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Combine all pages with page markers
  const combinedLines: Array<{ text: string; page: number }> = [];
  for (const page of pages) {
    if (!page.text) continue;
    const lines = page.text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      combinedLines.push({ text: line, page: page.pageNumber });
    }
  }

  let i = 0;
  while (i < combinedLines.length) {
    const { text, page } = combinedLines[i];

    // Try to detect a question start
    const qNum = detectQuestionNumber(text);
    if (qNum !== null) {
      const question = extractQuestion(combinedLines, i, qNum, page);
      if (question && question.options.length >= 2) {
        questions.push(question);
        // Skip lines consumed by this question
        i += question.rawLines.length;
        continue;
      }
    }
    i++;
  }

  logger.info(`Question parser found ${questions.length} questions`);
  return questions;
}

function detectQuestionNumber(line: string): number | null {
  for (const pattern of QUESTION_START_PATTERNS) {
    const m = line.match(pattern);
    if (m) {
      const num = parseInt(m[1], 10);
      if (!isNaN(num) && num >= 1 && num <= 300) {
        return num;
      }
    }
  }
  return null;
}

function extractQuestion(
  lines: Array<{ text: string; page: number }>,
  startIdx: number,
  questionNumber: number,
  startPage: number,
): ParsedQuestion | null {
  const rawLines: string[] = [];
  const pageNumbers: Set<number> = new Set([startPage]);

  // First line — question text (after stripping number prefix)
  let firstLine = lines[startIdx].text;
  // Strip question number prefix
  for (const pattern of QUESTION_START_PATTERNS) {
    firstLine = firstLine.replace(pattern, '').trim();
  }

  const questionTextLines: string[] = firstLine ? [firstLine] : [];
  const options: string[] = [];
  rawLines.push(lines[startIdx].text);

  let i = startIdx + 1;
  let inOptions = false;
  let consecutiveNonOption = 0;

  while (i < lines.length && options.length < 4) {
    const { text, page } = lines[i];

    // Stop if we hit the next question
    if (detectQuestionNumber(text) !== null) {
      break;
    }

    // Check for answer key section (stop parsing)
    if (/answer\s*key|answers?\s*:/i.test(text)) {
      break;
    }

    // Check if this line is an option
    const optionMatch = detectOption(text);
    if (optionMatch !== null) {
      inOptions = true;
      options[optionMatch.index] = optionMatch.text;
      pageNumbers.add(page);
      rawLines.push(text);
      consecutiveNonOption = 0;
      i++;
      continue;
    }

    // If we're in options section and see non-option, might be option continuation
    if (inOptions && options.length > 0 && options.length < 4) {
      // Could be a continuation of last option
      const lastOptionIdx = options.length - 1;
      if (text && !text.match(/^\d+[.)]/)) {
        options[lastOptionIdx] += ' ' + text;
        rawLines.push(text);
        i++;
        continue;
      }
    }

    // If not in options yet, accumulate question text
    if (!inOptions) {
      questionTextLines.push(text);
      pageNumbers.add(page);
      rawLines.push(text);
      consecutiveNonOption++;

      // If we see 5+ lines without options, might be a non-question
      if (consecutiveNonOption > 5) break;
    } else {
      consecutiveNonOption++;
      if (consecutiveNonOption > 2) break;
    }

    i++;
  }

  const questionText = questionTextLines.join(' ').trim();
  if (!questionText || options.length < 2) {
    return null;
  }

  // Calculate confidence based on completeness
  const hasAllOptions = options.filter(Boolean).length === 4;
  const confidence = hasAllOptions ? 90 : options.length >= 2 ? 70 : 40;

  return {
    questionNumber,
    questionText,
    options: options.filter(Boolean),
    pageNumbers: Array.from(pageNumbers),
    extractionConfidence: confidence,
    rawLines,
  };
}

function detectOption(line: string): { index: number; text: string } | null {
  for (const pattern of OPTION_PATTERNS) {
    const m = line.match(pattern);
    if (m) {
      const label = m[1].toLowerCase();
      const text = m[2].trim();
      const index = OPTION_LABEL_TO_INDEX[label];
      if (index !== undefined && text) {
        return { index, text };
      }
    }
  }
  return null;
}

/**
 * Convert parsed questions to ExtractedQuestion format (before answer matching)
 */
export function toExtractedQuestions(parsed: ParsedQuestion[]): ExtractedQuestion[] {
  return parsed.map((q) => ({
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    options: q.options,
    pageNumbers: q.pageNumbers,
    extractionConfidence: q.extractionConfidence,
    answerMappingConfidence: 0, // set after matching
    classificationConfidence: 0, // set after classification
    rawText: q.rawLines.join('\n'),
  }));
}
