import { Router } from 'express';
import { getDb, schema } from '../db/connection';
import { eq } from 'drizzle-orm';
import { validateRequest } from '../middleware/validator';
import { UserSettingsSchema } from '../../../shared/src/validation/schemas';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const db = getDb();

router.get('/', async (req, res, next) => {
  try {
    const userId = 'default-user';
    const settings = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId))
      .limit(1)
      .then(r => r[0]);

    if (!settings) throw new AppError(404, 'Settings not found', 'SETTINGS_NOT_FOUND');

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

router.patch('/', validateRequest({ body: UserSettingsSchema.partial() }), async (req, res, next) => {
  try {
    const userId = 'default-user';
    await db
      .update(schema.userSettings)
      .set({ ...req.body, updatedAt: new Date().toISOString() })
      .where(eq(schema.userSettings.userId, userId));

    const updated = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId))
      .limit(1)
      .then(r => r[0]);

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
