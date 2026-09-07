import { Router } from 'express';
import { getDb, schema } from '../db/connection';
import { eq, asc } from 'drizzle-orm';

const router = Router();
const db = getDb();

router.get('/', async (req, res, next) => {
  try {
    const { subjectId, chapterId } = req.query;
    
    let query = db.select().from(schema.topics).orderBy(asc(schema.topics.displayOrder));
    
    if (subjectId) {
      query = query.where(eq(schema.topics.subjectId, subjectId as string)) as any;
    } else if (chapterId) {
      query = query.where(eq(schema.topics.chapterId, chapterId as string)) as any;
    }
    
    const topics = await query;
    res.json({ success: true, data: topics });
  } catch (err) {
    next(err);
  }
});

export default router;
