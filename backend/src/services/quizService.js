const { Prisma } = require("@prisma/client");

const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");
const { applyLazyHeartRefill, buildHeartMetadata } = require("./heartService");

const FIRST_COMPLETION_GEM_REWARD = 10;
const XP_PER_LEVEL = 200;
const GMT_PLUS_7_OFFSET_MS = 7 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const calculateLevel = (totalXp) => Math.floor(Math.max(totalXp, 0) / XP_PER_LEVEL) + 1;

const getGmtPlus7DayWindow = (date = new Date()) => {
  const shiftedTime = date.getTime() + GMT_PLUS_7_OFFSET_MS;
  const shiftedDate = new Date(shiftedTime);
  const dayStartUtc = Date.UTC(
    shiftedDate.getUTCFullYear(),
    shiftedDate.getUTCMonth(),
    shiftedDate.getUTCDate(),
  );
  const start = new Date(dayStartUtc - GMT_PLUS_7_OFFSET_MS);

  return { start, end: new Date(start.getTime() + ONE_DAY_MS) };
};

const parseBodyPositiveInt = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || !Number.isSafeInteger(parsed)) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a positive numeric ID`);
  }

  return parsed;
};

const normalizeAnswer = (value) => String(value || "").trim().toLowerCase();

const toAttemptDto = (attempt) => ({
  id: attempt.id,
  unitAttemptId: attempt.unitAttemptId,
  unitId: attempt.unitId,
  exerciseId: attempt.exerciseId,
  response: attempt.response,
  isCorrect: attempt.isCorrect,
  heartsBefore: attempt.heartsBefore,
  heartsAfter: attempt.heartsAfter,
  xpEarned: attempt.xpEarned,
  attemptedAt: attempt.attemptedAt,
});

const toUnitAttemptDto = (unitAttempt) => ({
  id: unitAttempt.id,
  unitId: unitAttempt.unitId,
  status: unitAttempt.status === "COMPLETED" ? "completed" : "in_progress",
  startedAt: unitAttempt.startedAt,
  completedAt: unitAttempt.completedAt,
  totalExercises: unitAttempt.totalExercises,
  correctAnswers: unitAttempt.correctAnswers,
  score: unitAttempt.score,
  xpEarned: unitAttempt.xpEarned,
});

const getCorrectAnswer = (exercise) => {
  if (exercise.type === "MULTIPLE_CHOICE") {
    const correctOption = exercise.options.find((option) => option.id === exercise.correctOptionId);
    return correctOption ? { selectedOptionId: correctOption.id, text: correctOption.text } : null;
  }

  if (exercise.type === "FILL_BLANK") {
    return exercise.answerText || null;
  }

  return exercise.matchingPairs.map((pair) => ({ leftText: pair.leftText, rightText: pair.rightText }));
};

const validateMultipleChoice = (exercise, body) => {
  const selectedOptionId = parseBodyPositiveInt(body.selectedOptionId, "selectedOptionId");
  const selectedOption = exercise.options.find((option) => option.id === selectedOptionId);
  if (!selectedOption) {
    throw new ApiError(400, "INVALID_ANSWER_PAYLOAD", "Selected option does not belong to this exercise");
  }

  return {
    isCorrect: selectedOptionId === exercise.correctOptionId,
    response: { selectedOptionId },
  };
};

const validateFillBlank = (exercise, body) => {
  if (typeof body.answerText !== "string" || !body.answerText.trim()) {
    throw new ApiError(400, "INVALID_ANSWER_PAYLOAD", "answerText is required");
  }

  const acceptedAnswers = String(exercise.answerText || "")
    .split("|")
    .map(normalizeAnswer)
    .filter(Boolean);
  const normalizedAnswer = normalizeAnswer(body.answerText);

  return {
    isCorrect: acceptedAnswers.includes(normalizedAnswer),
    response: { answerText: body.answerText.trim() },
  };
};

const validateMatching = (exercise, body) => {
  if (!Array.isArray(body.pairs)) {
    throw new ApiError(400, "INVALID_ANSWER_PAYLOAD", "pairs must be an array");
  }

  if (body.pairs.length !== exercise.matchingPairs.length) {
    throw new ApiError(400, "INVALID_ANSWER_PAYLOAD", "pairs must include every required match exactly once");
  }

  const expectedByLeft = new Map(exercise.matchingPairs.map((pair) => [pair.leftText, pair.rightText]));
  const seenLeft = new Set();
  const responsePairs = body.pairs.map((pair) => {
    if (!pair || typeof pair.leftText !== "string" || typeof pair.rightText !== "string") {
      throw new ApiError(400, "INVALID_ANSWER_PAYLOAD", "Each pair requires leftText and rightText");
    }

    const leftText = pair.leftText.trim();
    const rightText = pair.rightText.trim();
    if (!expectedByLeft.has(leftText) || seenLeft.has(leftText)) {
      throw new ApiError(400, "INVALID_ANSWER_PAYLOAD", "pairs must match the required leftText values exactly once");
    }

    seenLeft.add(leftText);
    return { leftText, rightText };
  });

  const isCorrect = responsePairs.every((pair) => expectedByLeft.get(pair.leftText) === pair.rightText);
  return { isCorrect, response: { pairs: responsePairs } };
};

const validateAnswer = (exercise, body) => {
  if (exercise.type === "MULTIPLE_CHOICE") return validateMultipleChoice(exercise, body);
  if (exercise.type === "FILL_BLANK") return validateFillBlank(exercise, body);
  if (exercise.type === "MATCHING") return validateMatching(exercise, body);

  throw new ApiError(400, "INVALID_EXERCISE_TYPE", "Exercise type is not supported");
};

async function startUnitAttempt(userId, unitId) {
  const now = new Date();
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, isPublished: true, section: { isPublished: true } },
    select: { id: true },
  });

  if (!unit) {
    throw new ApiError(404, "UNIT_NOT_FOUND", "Unit not found");
  }

  const [unitAttempt, user] = await prisma.$transaction(async (tx) => {
    const createdAttempt = await tx.unitAttempt.create({
      data: { userId, unitId },
    });
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, hearts: true, maxHearts: true, heartRefilledAt: true },
    });
    if (!currentUser) {
      throw new ApiError(401, "INVALID_TOKEN", "Token user no longer exists");
    }
    const refilledUser = await applyLazyHeartRefill(tx, currentUser, now);
    return [createdAttempt, refilledUser];
  });

  return {
    unitAttempt: toUnitAttemptDto(unitAttempt),
    unitAttemptId: unitAttempt.id,
    ...buildHeartMetadata(user, now),
  };
}

async function submitExerciseAttempt(userId, exerciseId, body) {
  const unitAttemptId = parseBodyPositiveInt(body.unitAttemptId, "unitAttemptId");

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      unit: { select: { id: true, isPublished: true, section: { select: { isPublished: true } } } },
      options: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      matchingPairs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });

  if (!exercise || !exercise.unit.isPublished || !exercise.unit.section.isPublished) {
    throw new ApiError(404, "EXERCISE_NOT_FOUND", "Exercise not found");
  }

  const unitAttempt = await prisma.unitAttempt.findUnique({ where: { id: unitAttemptId } });
  if (!unitAttempt || unitAttempt.userId !== userId || unitAttempt.unitId !== exercise.unitId) {
    throw new ApiError(400, "UNIT_ATTEMPT_MISMATCH", "unitAttemptId does not belong to this user and exercise unit");
  }

  const { isCorrect, response } = validateAnswer(exercise, body || {});

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, hearts: true, maxHearts: true, heartRefilledAt: true },
    });
    if (!user) {
      throw new ApiError(401, "INVALID_TOKEN", "Token user no longer exists");
    }

    const now = new Date();
    const refilledUser = await applyLazyHeartRefill(tx, user, now);
    const heartsBefore = refilledUser.hearts;
    const heartsAfter = isCorrect ? heartsBefore : Math.max(heartsBefore - 1, 0);

    if (heartsAfter !== heartsBefore) {
      const heartRefilledAt = heartsBefore >= refilledUser.maxHearts ? now : refilledUser.heartRefilledAt;
      await tx.user.update({ where: { id: userId }, data: { hearts: heartsAfter, heartRefilledAt } });
      refilledUser.hearts = heartsAfter;
      refilledUser.heartRefilledAt = heartRefilledAt;
    }

    const attempt = await tx.exerciseAttempt.create({
      data: {
        userId,
        unitId: exercise.unitId,
        exerciseId,
        unitAttemptId,
        response,
        isCorrect,
        heartsBefore,
        heartsAfter,
      },
    });

    return {
      isCorrect,
      ...(isCorrect ? {} : { correctAnswer: getCorrectAnswer(exercise) }),
      ...buildHeartMetadata(refilledUser, now),
      attempt: toAttemptDto(attempt),
    };
  });
}

const getLatestAttemptsByExercise = (attempts) => {
  const latestByExercise = new Map();
  for (const attempt of attempts) {
    if (!latestByExercise.has(attempt.exerciseId)) {
      latestByExercise.set(attempt.exerciseId, attempt);
    }
  }

  return latestByExercise;
};

async function completeUnit(userId, unitId, body) {
  const unitAttemptId = parseBodyPositiveInt(body.unitAttemptId, "unitAttemptId");

  return prisma.$transaction(async (tx) => {
    const unitAttempt = await tx.unitAttempt.findUnique({ where: { id: unitAttemptId } });
    if (!unitAttempt || unitAttempt.userId !== userId || unitAttempt.unitId !== unitId) {
      throw new ApiError(400, "UNIT_ATTEMPT_MISMATCH", "unitAttemptId does not belong to this user and unit");
    }

    const unit = await tx.unit.findFirst({
      where: { id: unitId, isPublished: true, section: { isPublished: true } },
      select: { id: true, xpReward: true },
    });
    if (!unit) {
      throw new ApiError(404, "UNIT_NOT_FOUND", "Unit not found");
    }

    const exercises = await tx.exercise.findMany({ where: { unitId }, select: { id: true } });
    const totalExercises = exercises.length;
    const exerciseIds = new Set(exercises.map((exercise) => exercise.id));

    const attempts = await tx.exerciseAttempt.findMany({
      where: { userId, unitId, unitAttemptId },
      orderBy: [{ attemptedAt: "desc" }, { id: "desc" }],
    });
    const latestByExercise = getLatestAttemptsByExercise(attempts);

    if (totalExercises > 0 && latestByExercise.size < totalExercises) {
      throw new ApiError(400, "UNIT_INCOMPLETE", "All exercises in the unit must be attempted before completion");
    }

    const correctAnswers = [...latestByExercise.values()].filter(
      (attempt) => exerciseIds.has(attempt.exerciseId) && attempt.isCorrect,
    ).length;
    const accuracyRatio = totalExercises === 0 ? 1 : correctAnswers / totalExercises;
    const score = Math.round(accuracyRatio * 100);

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, hearts: true, maxHearts: true, heartRefilledAt: true, totalXp: true, level: true, gems: true, streak: true },
    });
    if (!user) {
      throw new ApiError(401, "INVALID_TOKEN", "Token user no longer exists");
    }

    const existingProgress = await tx.userUnitProgress.findUnique({
      where: { userId_unitId: { userId, unitId } },
    });

    const baseXp = unit.xpReward || 10;
    const accuracyBonus = Math.round(baseXp * accuracyRatio * 0.5);
    const now = new Date();
    const refilledUser = await applyLazyHeartRefill(tx, user, now);
    const heartBonus = Math.max(refilledUser.hearts, 0) * 2;
    const computedXp = baseXp + accuracyBonus + heartBonus;
    const idempotencyKey = `unit-completion:${unitId}`;

    let xpAwarded = 0;
    let gemsAwarded = 0;
    const previousLevel = user.level;
    let currentLevel = previousLevel;
    if (existingProgress?.status !== "COMPLETED") {
      try {
        await tx.xpLedger.create({
          data: {
            userId,
            unitId,
            unitAttemptId,
            source: "UNIT_COMPLETION",
            idempotencyKey,
            amount: computedXp,
          },
        });
        xpAwarded = computedXp;
        gemsAwarded = FIRST_COMPLETION_GEM_REWARD;
        currentLevel = calculateLevel(user.totalXp + computedXp);
        await tx.user.update({
          where: { id: userId },
          data: { totalXp: { increment: computedXp }, level: currentLevel, gems: { increment: gemsAwarded } },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          xpAwarded = 0;
          gemsAwarded = 0;
          currentLevel = previousLevel;
        } else {
          throw error;
        }
      }
    }

    const completedAt = now;
    const { start: todayStart, end: todayEnd } = getGmtPlus7DayWindow(completedAt);
    const completedAttemptToday = await tx.unitAttempt.findFirst({
      where: {
        userId,
        id: { not: unitAttemptId },
        status: "COMPLETED",
        completedAt: { gte: todayStart, lt: todayEnd },
      },
      select: { id: true },
    });
    const streakIncremented = unitAttempt.status !== "COMPLETED" && !completedAttemptToday;

    if (streakIncremented) {
      const yesterdayStart = new Date(todayStart.getTime() - ONE_DAY_MS);
      const lastCompletedAttempt = await tx.unitAttempt.findFirst({
        where: {
          userId,
          status: "COMPLETED",
          completedAt: { lt: todayStart },
        },
        orderBy: [{ completedAt: "desc" }, { id: "desc" }],
        select: { completedAt: true },
      });
      const hadActivityYesterday = lastCompletedAttempt
        && lastCompletedAttempt.completedAt >= yesterdayStart
        && lastCompletedAttempt.completedAt < todayStart;

      if (hadActivityYesterday) {
        await tx.user.update({ where: { id: userId }, data: { streak: { increment: 1 } } });
      } else {
        await tx.user.update({ where: { id: userId }, data: { streak: 1 } });
      }
    }

    const updatedAttempt = await tx.unitAttempt.update({
      where: { id: unitAttemptId },
      data: {
        status: "COMPLETED",
        score,
        totalExercises,
        correctAnswers,
        xpEarned: xpAwarded,
        completedAt,
      },
    });

    const progress = await tx.userUnitProgress.upsert({
      where: { userId_unitId: { userId, unitId } },
      update: {
        status: "COMPLETED",
        completedExercises: totalExercises,
        totalExercises,
        bestScore: Math.max(existingProgress?.bestScore ?? 0, score),
        ...(existingProgress?.status === "COMPLETED" ? {} : { completedAt }),
      },
      create: {
        userId,
        unitId,
        status: "COMPLETED",
        completedExercises: totalExercises,
        totalExercises,
        bestScore: score,
        completedAt,
      },
    });

    const freshUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, hearts: true, maxHearts: true, heartRefilledAt: true, totalXp: true, level: true, gems: true, streak: true },
    });

    return {
      completed: true,
      xpAwarded,
      gemsAwarded,
      streakIncremented,
      totalXp: freshUser.totalXp,
      previousLevel,
      level: freshUser.level,
      leveledUp: freshUser.level > previousLevel,
      gems: freshUser.gems,
      streak: freshUser.streak,
      ...buildHeartMetadata(freshUser, now),
      unitAttempt: toUnitAttemptDto(updatedAttempt),
      progress: {
        status: progress.status,
        completedExercises: progress.completedExercises,
        totalExercises: progress.totalExercises,
        bestScore: progress.bestScore,
        completedAt: progress.completedAt,
      },
    };
  });
}

module.exports = {
  completeUnit,
  startUnitAttempt,
  submitExerciseAttempt,
};
