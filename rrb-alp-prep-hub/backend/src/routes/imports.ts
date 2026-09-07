import { Router } from 'express';
import { nanoid } from 'nanoid';
import { getDb, schema } from '../db/connection';
import { eq, desc, sql } from 'drizzle-orm';
import { pdfUpload } from '../middleware/upload';
import { runImportPipeline } from '../pdf/importPipeline';
import { validateRequest } from '../middleware/validator';
import { ImportReviewActionSchema } from '../../../shared/src/validation/schemas';
import { AppError } from '../middleware/errorHandler';
import { safeJsonParse } from '../utils/helpers';
import { QuestionService } from '../services/questionService';

const router = Router();
const db = getDb();
const questionService = new QuestionService();

// Upload and process PDF
router.post('/pdf', pdfUpload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw new AppError(400, 'No file uploaded', 'NO_FILE');

    const { examName, examYear, examShift } = req.body;
    const importId = nanoid();

    // Create import record
    await db.insert(schema.pdfImports).values({
      id: importId,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      filePath: file.path,
      examName,
      examYear: examYear ? parseInt(examYear, 10) : undefined,
      examShift,
      status: 'PENDING',
    });

    // Run pipeline asynchronously (don't await)
    // In a real production setup, use a queue like BullMQ
    runImportPipeline({
      importId,
      filePath: file.path,
      fileName: file.originalname,
      examName,
      examYear: examYear ? parseInt(examYear, 10) : undefined,
      examShift,
    }).catch(err => {
      console.error(`Import pipeline failed for ${importId}:`, err);
    });

    res.status(202).json({
      success: true,
      message: 'File uploaded successfully. Processing started.',
      data: { importId },
    });
  } catch (err) {
    next(err);
  }
});

// Get all imports
router.get('/', async (req, res, next) => {
  try {
    const imports = await db
      .select()
      .from(schema.pdfImports)
      .orderBy(desc(schema.pdfImports.createdAt));

    res.json({
      success: true,
      data: imports.map((i) => ({
        ...i,
        report: safeJsonParse(i.report, null),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Get single import status
router.get('/:id', async (req, res, next) => {
  try {
    const imp = await db
      .select()
      .from(schema.pdfImports)
      .where(eq(schema.pdfImports.id, req.params.id))
      .limit(1)
      .then(r => r[0]);

    if (!imp) throw new AppError(404, 'Import not found', 'IMPORT_NOT_FOUND');

    res.json({
      success: true,
      data: {
        ...imp,
        report: safeJsonParse(imp.report, null),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get questions needing review for an import
router.get('/:id/review', async (req, res, next) => {
  try {
    const questions = await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.importId, req.params.id))
      // .andWhere(eq(schema.questions.verificationStatus, 'NEEDS_REVIEW')) 
      // If we only want needs_review, uncomment above. But sometimes user wants to review all.
      .orderBy(schema.questions.questionNumberInSource);

    // Fetch options
    const questionIds = questions.map(q => q.id);
    const options = questionIds.length > 0
      ? await db.select().from(schema.questionOptions).where(sql`${schema.questionOptions.questionId} IN ${questionIds}`)
      : [];
      
    const optionsByQId = options.reduce<Record<string, typeof options>>((acc, opt) => {
      (acc[opt.questionId] ??= []).push(opt);
      return acc;
    }, {});

    res.json({
      success: true,
      data: questions.map(q => ({
        ...q,
        options: (optionsByQId[q.id] ?? []).sort((a, b) => a.optionIndex - b.optionIndex),
      })).filter(q => q.verificationStatus === 'NEEDS_REVIEW'),
    });
  } catch (err) {
    next(err);
  }
});

// Review action on a question
router.patch('/review/:questionId', validateRequest({ body: ImportReviewActionSchema }), async (req, res, next) => {
  try {
    const { action, questionData } = req.body;
    const { questionId } = req.params;

    if (action === 'REJECT') {
      await questionService.update(questionId, { verificationStatus: 'REJECTED' });
    } else if (action === 'APPROVE') {
      // If there are edits, apply them first
      if (questionData) {
        await questionService.update(questionId, { ...questionData, verificationStatus: 'VERIFIED' });
      } else {
        await questionService.update(questionId, { verificationStatus: 'VERIFIED' });
      }
    } else if (action === 'SAVE') {
      // Just save without approving
      if (questionData) {
        await questionService.update(questionId, questionData);
      }
    }

    res.json({ success: true, message: `Question ${action.toLowerCase()}ed successfully.` });
  } catch (err) {
    next(err);
  }
});

export default router;
