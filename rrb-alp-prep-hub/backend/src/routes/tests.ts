import { Router } from 'express';
import { TestGeneratorService } from '../services/testGeneratorService';
import { validateRequest } from '../middleware/validator';
import { TestGenerationSchema } from '../../../shared/src/validation/schemas';

const router = Router();
const testGeneratorService = new TestGeneratorService();

// Generate a new test session
router.post('/generate', validateRequest({ body: TestGenerationSchema }), async (req, res, next) => {
  try {
    const session = await testGeneratorService.generateTest(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

// Get a specific test session with its questions
router.get('/:id', async (req, res, next) => {
  try {
    const sessionData = await testGeneratorService.getSession(req.params.id);
    res.json({ success: true, data: sessionData });
  } catch (err) {
    next(err);
  }
});

export default router;
