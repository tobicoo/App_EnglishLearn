const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");

const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const VALID_CATEGORIES = ["Grammar", "Vocabulary", "Reading", "Listening", "Writing", "Speaking", "Mixed"];

function normalizeIdParam(value, entityName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(404, `${entityName.toUpperCase()}_NOT_FOUND`, `${entityName} not found`);
  }
  return parsed;
}

function toExamDto(exam, { savedByUser = false, creatorName = null } = {}) {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    category: exam.category,
    difficulty: exam.difficulty,
    isPublic: exam.isPublic,
    isPremium: exam.isPremium,
    questionCount: exam.questionCount,
    creatorId: exam.creatorId,
    creatorName: creatorName ?? exam.creator?.name ?? null,
    bookmarkCount: exam._count?.bookmarks ?? 0,
    isSaved: savedByUser,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
  };
}

async function listPublicExams(userId, { category, difficulty, search, limit = 20, offset = 0 } = {}) {
  const where = { isPublic: true };
  if (category) where.category = category;
  if (difficulty && VALID_DIFFICULTIES.includes(difficulty.toUpperCase())) {
    where.difficulty = difficulty.toUpperCase();
  }
  if (search) {
    where.title = { contains: search };
  }

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      include: {
        creator: { select: { name: true } },
        _count: { select: { bookmarks: true } },
      },
    }),
    prisma.exam.count({ where }),
  ]);

  let savedExamIds = new Set();
  if (userId && exams.length > 0) {
    const bookmarks = await prisma.examBookmark.findMany({
      where: { userId, examId: { in: exams.map((e) => e.id) } },
      select: { examId: true },
    });
    savedExamIds = new Set(bookmarks.map((b) => b.examId));
  }

  return {
    exams: exams.map((e) => toExamDto(e, { savedByUser: savedExamIds.has(e.id) })),
    total,
  };
}

async function createExam(userId, input) {
  const title = String(input?.title || "").trim();
  if (!title) throw new ApiError(400, "VALIDATION_ERROR", "Title is required");
  if (title.length > 255) throw new ApiError(400, "VALIDATION_ERROR", "Title is too long");

  const difficulty = VALID_DIFFICULTIES.includes(String(input?.difficulty || "").toUpperCase())
    ? String(input.difficulty).toUpperCase()
    : "MEDIUM";

  const category = input?.category && VALID_CATEGORIES.includes(input.category)
    ? input.category
    : null;

  const isPublic = input?.accountType === "free" || input?.isPremium === false
    ? true
    : input?.isPublic !== false;

  const isPremium = input?.accountType === "premium" || input?.isPremium === true;

  const exam = await prisma.exam.create({
    data: {
      creatorId: userId,
      title,
      description: input?.description ? String(input.description).trim() : null,
      category,
      difficulty,
      isPublic,
      isPremium,
      questionCount: 0,
    },
    include: {
      creator: { select: { name: true } },
      _count: { select: { bookmarks: true } },
    },
  });

  return toExamDto(exam, { savedByUser: false });
}

async function getMyExams(userId, { limit = 20, offset = 0 } = {}) {
  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where: { creatorId: userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      include: {
        _count: { select: { bookmarks: true } },
      },
    }),
    prisma.exam.count({ where: { creatorId: userId } }),
  ]);

  return {
    exams: exams.map((e) => toExamDto(e, { savedByUser: false })),
    total,
  };
}

async function getSavedExams(userId, { limit = 20, offset = 0 } = {}) {
  const [bookmarks, total] = await Promise.all([
    prisma.examBookmark.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      include: {
        exam: {
          include: {
            creator: { select: { name: true } },
            _count: { select: { bookmarks: true } },
          },
        },
      },
    }),
    prisma.examBookmark.count({ where: { userId } }),
  ]);

  return {
    exams: bookmarks.map((b) => toExamDto(b.exam, { savedByUser: true })),
    total,
  };
}

async function toggleBookmark(userId, examId) {
  const id = normalizeIdParam(examId, "Exam");

  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam) throw new ApiError(404, "EXAM_NOT_FOUND", "Exam not found");

  const existing = await prisma.examBookmark.findUnique({
    where: { userId_examId: { userId, examId: id } },
  });

  if (existing) {
    await prisma.examBookmark.delete({ where: { id: existing.id } });
    return { saved: false, examId: id };
  }

  await prisma.examBookmark.create({ data: { userId, examId: id } });
  return { saved: true, examId: id };
}

async function removeBookmark(userId, examId) {
  const id = normalizeIdParam(examId, "Exam");
  await prisma.examBookmark.deleteMany({ where: { userId, examId: id } });
  return { saved: false, examId: id };
}

async function addQuestion(examId, userId, input) {
  const id = normalizeIdParam(examId, "Exam");

  const exam = await prisma.exam.findUnique({ where: { id } });
  if (!exam) throw new ApiError(404, "EXAM_NOT_FOUND", "Exam not found");
  if (exam.creatorId !== userId) throw new ApiError(403, "FORBIDDEN", "Not your exam");

  const questionText = String(input?.questionText || "").trim();
  if (!questionText) throw new ApiError(400, "VALIDATION_ERROR", "Question text is required");

  const type = ["MULTIPLE_CHOICE", "FILL_BLANK"].includes(String(input?.type || "").toUpperCase())
    ? String(input.type).toUpperCase()
    : "MULTIPLE_CHOICE";

  let options = null;
  let correctAnswer = null;

  if (type === "MULTIPLE_CHOICE") {
    const opts = Array.isArray(input?.options) ? input.options : [];
    if (opts.length < 2) throw new ApiError(400, "VALIDATION_ERROR", "At least 2 options required");
    if (!opts.some((o) => o.isCorrect)) throw new ApiError(400, "VALIDATION_ERROR", "One option must be correct");
    options = opts.map((o) => ({ text: String(o.text || "").trim(), isCorrect: Boolean(o.isCorrect) }));
  } else {
    correctAnswer = String(input?.correctAnswer || "").trim();
    if (!correctAnswer) throw new ApiError(400, "VALIDATION_ERROR", "Correct answer is required");
  }

  const maxSort = await prisma.examQuestion.findFirst({
    where: { examId: id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const [question] = await prisma.$transaction([
    prisma.examQuestion.create({
      data: {
        examId: id,
        questionText,
        type,
        options,
        correctAnswer,
        explanation: input?.explanation ? String(input.explanation).trim() : null,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    }),
    prisma.exam.update({ where: { id }, data: { questionCount: { increment: 1 } } }),
  ]);

  return question;
}

async function getExamQuestions(examId, requesterId) {
  const id = normalizeIdParam(examId, "Exam");

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      _count: { select: { bookmarks: true } },
      questions: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!exam) throw new ApiError(404, "EXAM_NOT_FOUND", "Exam not found");

  if (!exam.isPublic && exam.creatorId !== requesterId) {
    throw new ApiError(403, "FORBIDDEN", "This exam is private");
  }

  let isSaved = false;
  if (requesterId) {
    const bm = await prisma.examBookmark.findUnique({
      where: { userId_examId: { userId: requesterId, examId: id } },
    });
    isSaved = !!bm;
  }

  return { exam: toExamDto(exam, { savedByUser: isSaved }), questions: exam.questions };
}

async function deleteQuestion(examId, questionId, userId) {
  const eid = normalizeIdParam(examId, "Exam");
  const qid = normalizeIdParam(questionId, "Question");

  const exam = await prisma.exam.findUnique({ where: { id: eid } });
  if (!exam) throw new ApiError(404, "EXAM_NOT_FOUND", "Exam not found");
  if (exam.creatorId !== userId) throw new ApiError(403, "FORBIDDEN", "Not your exam");

  const question = await prisma.examQuestion.findFirst({ where: { id: qid, examId: eid } });
  if (!question) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found");

  await prisma.$transaction([
    prisma.examQuestion.delete({ where: { id: qid } }),
    prisma.exam.update({ where: { id: eid }, data: { questionCount: { decrement: 1 } } }),
  ]);

  return { deleted: true, questionId: qid };
}

module.exports = {
  addQuestion,
  createExam,
  deleteQuestion,
  getExamQuestions,
  getMyExams,
  getSavedExams,
  listPublicExams,
  removeBookmark,
  toggleBookmark,
};
