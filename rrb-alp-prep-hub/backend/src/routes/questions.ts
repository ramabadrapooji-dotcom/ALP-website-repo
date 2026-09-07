import { Router } from 'express';
import { QuestionService } from '../services/questionService';
import { validateRequest } from '../middleware/validator';
import { CreateQuestionSchema, UpdateQuestionSchema, QuestionFilterSchema } from '../../../shared/src/validation/schemas';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const questionService = new QuestionService();

router.get('/', validateRequest({ query: QuestionFilterSchema }), async (req, res, next) => {
  try {
    const result = await questionService.findAll(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await questionService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const question = await questionService.findById(req.params.id);
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
});

router.post('/', validateRequest({ body: CreateQuestionSchema }), async (req, res, next) => {
  try {
    const question = await questionService.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validateRequest({ body: UpdateQuestionSchema }), async (req, res, next) => {
  try {
    const question = await questionService.update(req.params.id, req.body);
    res.json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await questionService.delete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

export default router;
