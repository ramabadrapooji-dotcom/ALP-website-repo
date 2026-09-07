import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface PageExtraction {
  pageNumber: number;
  text: string;
  hasTextLayer: boolean;
  usedOcr: boolean;
  ocrConfidence?: number;
  wordCount: number;
}

export interface PDFExtractionResult {
  totalPages: number;
  pages: PageExtraction[];
  fullText: string;
  hasUsableTextLayer: boolean;
  pagesNeedingOcr: number[];
  metadata: {
    title?: string;
    author?: string;
    creator?: string;
  };
}

const MIN_WORDS_PER_PAGE = 20; // pages with < 20 words likely need OCR

/**
 * Extract text from a PDF file.
 * Detects whether each page has a usable text layer.
 * Pages below word threshold are flagged for OCR.
 */
export async function extractPdfText(filePath: string): Promise<PDFExtractionResult> {
  logger.info(`Extracting PDF: ${path.basename(filePath)}`);

  const buffer = fs.readFileSync(filePath);
  const pages: PageExtraction[] = [];
  const pagesNeedingOcr: number[] = [];

  // Custom render callback to capture per-page text
  const perPageTexts: string[] = [];

  const options: pdfParse.Options = {
    // pagerender callback to capture per-page content
    pagerender: (pageData: { getTextContent: () => Promise<{ items: Array<{ str: string }> }> }) => {
      return pageData.getTextContent().then((textContent) => {
        const text = textContent.items
          .map((item) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        perPageTexts.push(text);
        return text;
      });
    },
  };

  let parsed;
  try {
    parsed = await pdfParse(buffer, options);
  } catch (err) {
    logger.error('pdf-parse failed:', err);
    throw new Error(`PDF parsing failed: ${(err as Error).message}`);
  }

  // If per-page capture didn't work (some PDF versions), fall back to full text split
  const totalPages = parsed.numpages;

  // Build page extractions
  for (let i = 0; i < totalPages; i++) {
    const pageText = perPageTexts[i] ?? '';
    const wordCount = pageText.split(/\s+/).filter(Boolean).length;
    const hasTextLayer = wordCount >= MIN_WORDS_PER_PAGE;

    if (!hasTextLayer) {
      pagesNeedingOcr.push(i + 1);
    }

    pages.push({
      pageNumber: i + 1,
      text: pageText,
      hasTextLayer,
      usedOcr: false,
      wordCount,
    });
  }

  // If per-page capture gave no results, fall back: split full text by heuristics
  if (perPageTexts.length === 0 && parsed.text) {
    // No per-page callback support — use full text as single block
    const fullWordCount = parsed.text.split(/\s+/).filter(Boolean).length;
    pages.length = 0;
    pages.push({
      pageNumber: 1,
      text: parsed.text,
      hasTextLayer: fullWordCount > MIN_WORDS_PER_PAGE,
      usedOcr: false,
      wordCount: fullWordCount,
    });
  }

  const hasUsableTextLayer = pages.some((p) => p.hasTextLayer);

  logger.info(
    `PDF extracted: ${totalPages} pages, ${pagesNeedingOcr.length} need OCR, text layer: ${hasUsableTextLayer}`
  );

  return {
    totalPages,
    pages,
    fullText: parsed.text ?? pages.map((p) => p.text).join('\n'),
    hasUsableTextLayer,
    pagesNeedingOcr,
    metadata: {
      title: parsed.info?.Title,
      author: parsed.info?.Author,
      creator: parsed.info?.Creator,
    },
  };
}
