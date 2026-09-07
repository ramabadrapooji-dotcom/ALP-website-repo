import { nanoid } from 'nanoid';
import { getDb, schema } from './connection';
import { CURRICULUM } from '../../../shared/src/constants/subjects';
import { RRB_ALP_CBT1_CONFIG } from '../../../shared/src/constants/examConfig';
import { logger } from '../utils/logger';

const {
  subjects,
  chapters,
  topics,
  subtopics,
  examConfigurations,
  users,
  userSettings,
} = schema;

async function seed() {
  const db = getDb();
  logger.info('Seeding database...');

  // ─── Default user (single-user mode) ────────────────────────────────────────
  const userId = 'default-user';
  await db
    .insert(users)
    .values({ id: userId, name: 'Learner' })
    .onConflictDoNothing();

  await db
    .insert(userSettings)
    .values({ id: nanoid(), userId })
    .onConflictDoNothing();

  logger.info('Seeded default user');

  // ─── Curriculum ───────────────────────────────────────────────────────────────
  for (let si = 0; si < CURRICULUM.length; si++) {
    const subjectDef = CURRICULUM[si];

    // Insert subject
    const subjectId = `sub-${subjectDef.shortCode.toLowerCase()}`;
    await db
      .insert(subjects)
      .values({
        id: subjectId,
        name: subjectDef.name,
        shortCode: subjectDef.shortCode,
        color: subjectDef.color,
        icon: subjectDef.icon,
        displayOrder: si,
      })
      .onConflictDoNothing();

    for (let ci = 0; ci < subjectDef.chapters.length; ci++) {
      const chapterDef = subjectDef.chapters[ci];
      const chapterId = nanoid();

      await db
        .insert(chapters)
        .values({
          id: chapterId,
          subjectId,
          name: chapterDef.name,
          displayOrder: ci,
        })
        .onConflictDoNothing();

      for (let ti = 0; ti < chapterDef.topics.length; ti++) {
        const topicDef = chapterDef.topics[ti];
        const topicId = nanoid();

        await db
          .insert(topics)
          .values({
            id: topicId,
            chapterId,
            subjectId,
            name: topicDef.name,
            displayOrder: ti,
          })
          .onConflictDoNothing();

        if (topicDef.subtopics) {
          for (let sti = 0; sti < topicDef.subtopics.length; sti++) {
            const subtopicDef = topicDef.subtopics[sti];
            await db
              .insert(subtopics)
              .values({
                id: nanoid(),
                topicId,
                name: subtopicDef.name,
                displayOrder: sti,
              })
              .onConflictDoNothing();
          }
        }
      }
    }

    logger.info(`Seeded subject: ${subjectDef.name}`);
  }

  // ─── Default Exam Configuration ────────────────────────────────────────────
  await db
    .insert(examConfigurations)
    .values({
      id: RRB_ALP_CBT1_CONFIG.id,
      name: RRB_ALP_CBT1_CONFIG.name,
      description: RRB_ALP_CBT1_CONFIG.description,
      durationSeconds: RRB_ALP_CBT1_CONFIG.durationSeconds,
      totalQuestions: RRB_ALP_CBT1_CONFIG.totalQuestions,
      marksPerCorrect: RRB_ALP_CBT1_CONFIG.marksPerCorrect,
      negativeMarksPerWrong: RRB_ALP_CBT1_CONFIG.negativeMarksPerWrong,
      sections: JSON.stringify(RRB_ALP_CBT1_CONFIG.sections),
      languageOptions: JSON.stringify(RRB_ALP_CBT1_CONFIG.languageOptions),
      isDefault: true,
    })
    .onConflictDoNothing();

  logger.info('Seeded exam configuration');
  logger.info('Database seeding complete ✓');
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
