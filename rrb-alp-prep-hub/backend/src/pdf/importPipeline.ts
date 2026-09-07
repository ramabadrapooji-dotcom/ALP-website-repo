import { nanoid } from 'nanoid';
import path from 'path';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db/connection';
import { extractPdfText } from './pdfExtractor';
import { parseQuestions, toExtractedQuestions } from './questionParser';
import { parseAnswerKey } from './answerKeyParser';
import { matchAnswers } from './answerMatcher';
import { classifyQuestion } from './classifier';
import { checkDuplicate } from './duplicateDetector';
import { generateQuestionId } from '../utils/helpers';
import type { ImportReport } from '../../../shared/src/types/import';
import type { MatchedQuestion } from './answerMatcher';
import { extractQuestionsWithAI } from './aiExtractorService';
import { logger } from '../utils/logger';

export interface ImportPipelineOptions {
  importId: string;
  filePath: string;
  fileName: string;
  examName?: string;
  examYear?: number;
  examShift?: string;
}

/**
 * Full PDF import pipeline:
 * Extract → Parse → Answer Key → Match → Classify → Duplicate Check → Save
 */
export async function runImportPipeline(options: ImportPipelineOptions): Promise<ImportReport> {
  const { importId, filePath, fileName, examName, examYear, examShift } = options;
  const db = getDb();
  const startTime = Date.now();

  logger.info(`[Import ${importId}] Starting pipeline for: ${fileName}`);

  // ── Update status: PROCESSING ────────────────────────────────────────────────
  await db
    .update(schema.pdfImports)
    .set({ status: 'PROCESSING' })
    .where(eq(schema.pdfImports.id, importId));

  // ── STEP 1-4: AI or Legacy Extraction ────────────────────────────────────────
  let matchedQuestions: MatchedQuestion[] = [];
  let extraction;
  let parsedQuestions: any[] = [];
  let answerKeyResult = { totalFound: 0, entries: new Map() };

  if (process.env.GEMINI_API_KEY) {
    logger.info(`[Import ${importId}] Using AI Extractor with Gemini API`);
    try {
      const aiResults = await extractQuestionsWithAI(filePath, fileName);
      
      // Save a dummy page for AI imports so we don't break page count checks
      await db.insert(schema.pdfPages).values({
        id: nanoid(),
        importId,
        pageNumber: 1,
        hasTextLayer: true,
        usedOcr: false,
        extractedText: 'AI Extracted Content',
        ocrConfidence: 100,
      }).onConflictDoNothing();

      // Map AI results to MatchedQuestion
      matchedQuestions = aiResults.map((aiq) => ({
        questionNumber: aiq.questionNumber,
        questionText: aiq.questionText,
        options: aiq.options,
        rawText: aiq.questionText + '\n' + aiq.options.join('\n'),
        pageNumbers: [1],
        extractionConfidence: 95,
        detectedAnswer: aiq.correctAnswerIndex ?? undefined,
        answerLabel: aiq.correctAnswerIndex !== null ? String.fromCharCode(65 + aiq.correctAnswerIndex) : undefined,
        answerMappingConfidence: aiq.correctAnswerIndex !== null ? 90 : 0,
        classificationConfidence: 95,
        verificationStatus: aiq.correctAnswerIndex !== null ? 'VERIFIED' : 'NEEDS_REVIEW'
      }));
      
      parsedQuestions = matchedQuestions;
      extraction = { totalPages: 1, pages: [{ hasTextLayer: true, usedOcr: false }] };
      answerKeyResult.totalFound = aiResults.filter(r => r.correctAnswerIndex !== null).length;

    } catch (err) {
      logger.error(`[Import ${importId}] AI Extraction failed, falling back to legacy...`, err);
    }
  }
  
  if (matchedQuestions.length === 0) {
    logger.info(`[Import ${importId}] Using Legacy Text Extractor`);
    try {
      extraction = await extractPdfText(filePath);
      
      for (const page of extraction.pages) {
        await db.insert(schema.pdfPages).values({
          id: nanoid(),
          importId,
          pageNumber: page.pageNumber,
          hasTextLayer: page.hasTextLayer,
          usedOcr: page.usedOcr,
          extractedText: page.text.slice(0, 10000),
          ocrConfidence: page.ocrConfidence,
        }).onConflictDoNothing();
      }

      parsedQuestions = parseQuestions(extraction.pages);
      const extractedQuestions = toExtractedQuestions(parsedQuestions);
      answerKeyResult = parseAnswerKey(extraction.fullText);
      matchedQuestions = matchAnswers(extractedQuestions, answerKeyResult.entries);
    } catch (err) {
      await failImport(importId, `Extraction failed: ${(err as Error).message}`);
      throw err;
    }
  }

  // ── STEP 5: Classify + Duplicate Check + Save ─────────────────────────────────
  logger.info(`[Import ${importId}] Step 5: Classifying and saving questions`);

  let verified = 0;
  let needsReview = 0;
  let rejected = 0;
  let exactDuplicates = 0;
  let nearDuplicates = 0;
  let classifiedOk = 0;
  let classifiedFailed = 0;
  const needsReviewIds: string[] = [];
  const failedIds: string[] = [];
  const duplicateIds: string[] = [];

  // Create question source record
  const sourceId = nanoid();
  await db.insert(schema.questionSources).values({
    id: sourceId,
    name: examName ?? fileName,
    sourceType: 'PYQ',
    examName,
    examYear,
    examShift,
    fileName,
    filePath,
    importId,
  }).onConflictDoNothing();

  for (const q of matchedQuestions) {
    // Skip if extraction quality is too low
    if (q.extractionConfidence < 20 || q.options.length < 2) {
      rejected++;
      failedIds.push(`Q${q.questionNumber}`);
      continue;
    }

    // Classify
    const classification = classifyQuestion(q.questionText, q.options);
    if (classification.confidence >= 60) {
      classifiedOk++;
    } else {
      classifiedFailed++;
    }

    // Duplicate check
    const dupCheck = await checkDuplicate(q.questionText, classification.subject);
    if (dupCheck.isDuplicate) {
      exactDuplicates++;
      duplicateIds.push(`Q${q.questionNumber}`);
      continue; // Skip exact duplicates
    }
    if (dupCheck.isNearDuplicate) {
      nearDuplicates++;
      // Still save but flag as NEEDS_REVIEW
    }

    // Determine final verification status
    let verificationStatus = q.verificationStatus;
    if (dupCheck.isNearDuplicate) {
      verificationStatus = 'NEEDS_REVIEW';
    }
    if (classification.confidence < 60) {
      verificationStatus = 'NEEDS_REVIEW';
    }

    // Generate question ID
    const questionId = generateQuestionId(classification.subject, examYear);

    // Save question
    await db.insert(schema.questions).values({
      id: questionId,
      questionText: q.questionText,
      originalQuestionText: q.rawText,
      subjectName: classification.subject,
      chapterName: classification.chapter,
      topicName: classification.topic,
      correctAnswer: q.detectedAnswer ?? 0,
      difficulty: 'MEDIUM', // default — can be updated in review
      tags: '[]',
      language: 'ENGLISH',
      sourceType: 'PYQ',
      sourceId,
      importId,
      sourceName: examName ?? fileName,
      examName,
      examYear,
      examShift,
      pdfPageNumber: q.pageNumbers[0],
      questionNumberInSource: q.questionNumber,
      verificationStatus,
      extractionConfidence: q.extractionConfidence,
      answerMappingConfidence: q.answerMappingConfidence,
      classificationConfidence: classification.confidence,
    });

    // Save options
    for (let i = 0; i < q.options.length; i++) {
      await db.insert(schema.questionOptions).values({
        id: nanoid(),
        questionId,
        optionIndex: i,
        optionText: q.options[i],
      });
    }

    if (verificationStatus === 'VERIFIED') {
      verified++;
    } else if (verificationStatus === 'NEEDS_REVIEW') {
      needsReview++;
      needsReviewIds.push(questionId);
    }
  }

  // ── STEP 6: Build Report ──────────────────────────────────────────────────────
  const processingTimeMs = Date.now() - startTime;
  const safeExtraction = extraction || { totalPages: 1, pages: [] };
  const report: ImportReport = {
    importId,
    fileName,
    examName,
    examYear,
    examShift,
    totalPages: safeExtraction.totalPages,
    pagesWithText: safeExtraction.pages.filter((p: any) => p.hasTextLayer).length,
    pagesWithOCR: safeExtraction.pages.filter((p: any) => p.usedOcr).length,
    questionsDetected: parsedQuestions.length,
    questionsParsed: matchedQuestions.length,
    answersMatched: answerKeyResult.totalFound,
    questionsVerified: verified,
    questionsNeedingReview: needsReview,
    questionsRejected: rejected,
    exactDuplicates,
    nearDuplicates,
    classifiedSuccessfully: classifiedOk,
    classificationFailed: classifiedFailed,
    needsReviewIds,
    failedIds,
    duplicateIds,
    processingTimeMs,
  };

  // ── Update import record ───────────────────────────────────────────────────────
  await db
    .update(schema.pdfImports)
    .set({
      status: needsReview > 0 ? 'NEEDS_REVIEW' : 'COMPLETED',
      report: JSON.stringify(report),
      processingTimeMs,
      completedAt: new Date().toISOString(),
    })
    .where(eq(schema.pdfImports.id, importId));

  logger.info(
    `[Import ${importId}] Pipeline complete in ${processingTimeMs}ms. ` +
    `Verified: ${verified}, NeedsReview: ${needsReview}, Rejected: ${rejected}`
  );

  return report;
}

async function failImport(importId: string, errorMessage: string) {
  const db = getDb();
  await db
    .update(schema.pdfImports)
    .set({
      status: 'FAILED',
      errorMessage,
      completedAt: new Date().toISOString(),
    })
    .where(eq(schema.pdfImports.id, importId));
}
