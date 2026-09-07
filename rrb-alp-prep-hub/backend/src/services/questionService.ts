import { getDb, schema } from '../db/connection';
import { eq, like, and, or, desc, asc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { generateQuestionId, safeJsonParse } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import type { QuestionFilterSchema } from '../../../shared/src/validation/schemas';
import { z } from 'zod';
import type { QuestionFilterSchema as QFS } from '../../../shared/src/validation/schemas';

type FilterParams = z.infer<typeof QFS>;

export class QuestionService {
  private db = getDb();

  async findAll(filters: Partial<FilterParams>) {
    const {
      search,
      subject,
      topic,
      difficulty,
      sourceType,
      examYear,
      verificationStatus,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(schema.questions.questionText, `%${search}%`),
          like(schema.questions.id, `%${search}%`),
        ),
      );
    }
    if (subject) conditions.push(eq(schema.questions.subjectName, subject));
    if (topic) conditions.push(eq(schema.questions.topicName, topic));
    if (difficulty) conditions.push(eq(schema.questions.difficulty, difficulty));
    if (sourceType) conditions.push(eq(schema.questions.sourceType, sourceType));
    if (examYear) conditions.push(eq(schema.questions.examYear, examYear));
    if (verificationStatus) conditions.push(eq(schema.questions.verificationStatus, verificationStatus));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderCol =
      sortBy === 'difficulty' ? schema.questions.difficulty
        : sortBy === 'subject' ? schema.questions.subjectName
        : schema.questions.createdAt;

    const orderDir = sortOrder === 'asc' ? asc(orderCol) : desc(orderCol);
    const offset = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      this.db
        .select()
        .from(schema.questions)
        .where(whereClause)
        .orderBy(orderDir)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.questions)
        .where(whereClause)
        .then((r) => r[0]?.count ?? 0),
    ]);

    // Attach options to each question
    const questionIds = questions.map((q) => q.id);
    const options = questionIds.length > 0
      ? await this.db
          .select()
          .from(schema.questionOptions)
          .where(sql`${schema.questionOptions.questionId} IN ${questionIds}`)
      : [];

    const optionsByQuestionId = options.reduce<Record<string, typeof options>>((acc, opt) => {
      (acc[opt.questionId] ??= []).push(opt);
      return acc;
    }, {});

    return {
      questions: questions.map((q) => ({
        ...q,
        tags: safeJsonParse<string[]>(q.tags, []),
        options: (optionsByQuestionId[q.id] ?? []).sort((a, b) => a.optionIndex - b.optionIndex),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const question = await this.db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.id, id))
      .limit(1)
      .then((r) => r[0]);

    if (!question) throw new AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');

    const options = await this.db
      .select()
      .from(schema.questionOptions)
      .where(eq(schema.questionOptions.questionId, id));

    return {
      ...question,
      tags: safeJsonParse<string[]>(question.tags, []),
      options: options.sort((a, b) => a.optionIndex - b.optionIndex),
    };
  }

  async create(data: Record<string, unknown>) {
    const id = generateQuestionId(data.subject as string, data.examYear as number);
    const options = (data.options as Array<{ index: number; text: string }>) ?? [];

    await this.db.insert(schema.questions).values({
      id,
      questionText: data.questionText as string,
      originalQuestionText: data.originalQuestionText as string | undefined,
      explanation: data.explanation as string | undefined,
      subjectName: data.subject as string,
      chapterName: data.chapter as string | undefined,
      topicName: data.topic as string | undefined,
      subtopicName: data.subtopic as string | undefined,
      difficulty: (data.difficulty as string) ?? 'MEDIUM',
      tags: JSON.stringify(data.tags ?? []),
      language: (data.language as string) ?? 'ENGLISH',
      correctAnswer: data.correctAnswer as number,
      sourceType: (data.sourceType as string) ?? 'ORIGINAL',
      sourceName: data.sourceName as string | undefined,
      examName: data.examName as string | undefined,
      examYear: data.examYear as number | undefined,
      examShift: data.examShift as string | undefined,
      verificationStatus: 'UNVERIFIED',
      createdBy: 'default-user',
    });

    for (const opt of options) {
      await this.db.insert(schema.questionOptions).values({
        id: nanoid(),
        questionId: id,
        optionIndex: opt.index,
        optionText: opt.text,
      });
    }

    return this.findById(id);
  }

  async update(id: string, data: Record<string, unknown>) {
    const existing = await this.findById(id);
    if (!existing) throw new AppError(404, 'Question not found', 'QUESTION_NOT_FOUND');

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
      editedBy: 'default-user',
      editedAt: new Date().toISOString(),
    };

    const fieldMap: Record<string, string> = {
      questionText: 'questionText',
      explanation: 'explanation',
      correctAnswer: 'correctAnswer',
      difficulty: 'difficulty',
      verificationStatus: 'verificationStatus',
      subject: 'subjectName',
      chapter: 'chapterName',
      topic: 'topicName',
      subtopic: 'subtopicName',
      answerManuallyVerified: 'answerManuallyVerified',
    };

    for (const [key, dbKey] of Object.entries(fieldMap)) {
      if (key in data && data[key] !== undefined) {
        (updateData as Record<string, unknown>)[dbKey] = data[key];
      }
    }

    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.db
      .update(schema.questions)
      .set(updateData as any)
      .where(eq(schema.questions.id, id));

    // Update options if provided
    if (data.options && Array.isArray(data.options)) {
      await this.db
        .delete(schema.questionOptions)
        .where(eq(schema.questionOptions.questionId, id));

      for (const opt of data.options as Array<{ index: number; text: string }>) {
        await this.db.insert(schema.questionOptions).values({
          id: nanoid(),
          questionId: id,
          optionIndex: opt.index,
          optionText: opt.text,
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: string) {
    await this.db.delete(schema.questions).where(eq(schema.questions.id, id));
  }

  async getStats() {
    const [total, verified, needsReview, bySubject] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(schema.questions).then((r) => r[0]?.count ?? 0),
      this.db.select({ count: sql<number>`count(*)` }).from(schema.questions).where(eq(schema.questions.verificationStatus, 'VERIFIED')).then((r) => r[0]?.count ?? 0),
      this.db.select({ count: sql<number>`count(*)` }).from(schema.questions).where(eq(schema.questions.verificationStatus, 'NEEDS_REVIEW')).then((r) => r[0]?.count ?? 0),
      this.db
        .select({ subject: schema.questions.subjectName, count: sql<number>`count(*)` })
        .from(schema.questions)
        .groupBy(schema.questions.subjectName),
    ]);

    return { total, verified, needsReview, bySubject };
  }
}
