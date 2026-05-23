const prisma = require("../lib/prisma");

async function getLearningHistory(userId, { limit = 20, offset = 0 } = {}) {
  const attempts = await prisma.unitAttempt.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: [{ completedAt: "desc" }, { id: "desc" }],
    take: Number(limit) || 20,
    skip: Number(offset) || 0,
    include: {
      unit: {
        select: {
          id: true,
          title: true,
          kind: true,
          section: { select: { id: true, title: true } },
        },
      },
    },
  });

  const total = await prisma.unitAttempt.count({ where: { userId, status: "COMPLETED" } });

  return {
    history: attempts.map((a) => ({
      id: a.id,
      type: "learning",
      title: a.unit.title || `Unit ${a.unitId}`,
      category: a.unit.section?.title || "",
      sectionId: a.unit.section?.id,
      unitId: a.unitId,
      kind: a.unit.kind,
      score: a.score,
      correctAnswers: a.correctAnswers,
      totalExercises: a.totalExercises,
      xpEarned: a.xpEarned,
      completedAt: a.completedAt,
      startedAt: a.startedAt,
    })),
    total,
  };
}

async function getCreatedHistory(userId, { limit = 20, offset = 0 } = {}) {
  const exams = await prisma.exam.findMany({
    where: { creatorId: userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: Number(limit) || 20,
    skip: Number(offset) || 0,
    include: {
      _count: { select: { bookmarks: true } },
    },
  });

  const total = await prisma.exam.count({ where: { creatorId: userId } });

  return {
    history: exams.map((e) => ({
      id: e.id,
      type: "created",
      title: e.title,
      category: e.category || "",
      difficulty: e.difficulty,
      questionCount: e.questionCount,
      isPublic: e.isPublic,
      isPremium: e.isPremium,
      bookmarkCount: e._count.bookmarks,
      createdAt: e.createdAt,
    })),
    total,
  };
}

module.exports = { getCreatedHistory, getLearningHistory };
