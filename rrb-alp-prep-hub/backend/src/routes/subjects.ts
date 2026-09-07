import { Router } from 'express';
import { getDb, schema } from '../db/connection';
import { eq, asc } from 'drizzle-orm';

const router = Router();
const db = getDb();

router.get('/', async (req, res, next) => {
  try {
    const allSubjects = await db
      .select()
      .from(schema.subjects)
      .orderBy(asc(schema.subjects.displayOrder));
      
    // Fetch chapters for these subjects
    const allChapters = await db
      .select()
      .from(schema.chapters)
      .orderBy(asc(schema.chapters.displayOrder));
      
    const chaptersBySubjectId = allChapters.reduce<Record<string, typeof allChapters>>((acc, chapter) => {
      (acc[chapter.subjectId] ??= []).push(chapter);
      return acc;
    }, {});
    
    res.json({ 
      success: true, 
      data: allSubjects.map(s => ({
        ...s,
        chapters: chaptersBySubjectId[s.id] ?? []
      })) 
    });
  } catch (err) {
    next(err);
  }
});

export default router;
