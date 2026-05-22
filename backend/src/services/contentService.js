const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");

const progressStatusByUnitId = (progressRows) => {
  return new Map(progressRows.map((progress) => [progress.unitId, progress]));
};

const toClientStatus = (unit, progress, firstAvailableUnitId) => {
  if (progress?.status === "COMPLETED") return "done";
  if (progress?.status === "IN_PROGRESS" || unit.id === firstAvailableUnitId) return "todo";
  return "locked";
};

const toUnitPayload = (unit, progress, firstAvailableUnitId) => {
  const status = toClientStatus(unit, progress, firstAvailableUnitId);
  const xpAwarded = progress?.status === "COMPLETED" ? unit.xpReward : 0;

  return {
    id: unit.id,
    sectionId: unit.sectionId,
    title: unit.title,
    description: unit.description,
    kind: unit.kind.toLowerCase(),
    order: unit.sortOrder,
    sortOrder: unit.sortOrder,
    status,
    type: status,
    baseXp: unit.xpReward,
    xpAwarded,
    progress: {
      status: progress?.status ?? "NOT_STARTED",
      completedExercises: progress?.completedExercises ?? 0,
      totalExercises: progress?.totalExercises ?? 0,
      bestScore: progress?.bestScore ?? null,
      completedAt: progress?.completedAt ?? null,
    },
  };
};

const getPublishedUnitsWithProgress = async (userId) => {
  const units = await prisma.unit.findMany({
    where: {
      isPublished: true,
      section: { isPublished: true },
    },
    orderBy: [{ section: { sortOrder: "asc" } }, { sortOrder: "asc" }, { id: "asc" }],
  });
  const progressRows = await prisma.userUnitProgress.findMany({ where: { userId } });
  const progressByUnitId = progressStatusByUnitId(progressRows);
  const firstAvailableUnitId = units.find((unit) => progressByUnitId.get(unit.id)?.status !== "COMPLETED")?.id;

  return { units, progressByUnitId, firstAvailableUnitId };
};

async function getSections(userId) {
  const sections = await prisma.section.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      units: {
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
  });

  const progressRows = await prisma.userUnitProgress.findMany({ where: { userId } });
  const progressByUnitId = progressStatusByUnitId(progressRows);
  const orderedUnits = sections.flatMap((section) => section.units);
  const firstAvailableUnitId = orderedUnits.find((unit) => progressByUnitId.get(unit.id)?.status !== "COMPLETED")?.id;

  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    subTitle: section.subtitle,
    subtitle: section.subtitle,
    order: section.sortOrder,
    sortOrder: section.sortOrder,
    units: section.units.map((unit) => toUnitPayload(unit, progressByUnitId.get(unit.id), firstAvailableUnitId)),
  }));
}

async function getUnit(userId, unitId) {
  const { units, progressByUnitId, firstAvailableUnitId } = await getPublishedUnitsWithProgress(userId);
  const unit = units.find((candidate) => candidate.id === unitId);

  if (!unit) {
    throw new ApiError(404, "UNIT_NOT_FOUND", "Unit not found");
  }

  return toUnitPayload(unit, progressByUnitId.get(unit.id), firstAvailableUnitId);
}

const toExercisePayload = (exercise) => {
  const type = exercise.type.toLowerCase();
  const basePayload = {
    id: exercise.id,
    unitId: exercise.unitId,
    type,
    prompt: exercise.prompt,
    instruction: exercise.explanation,
    order: exercise.sortOrder,
  };

  if (exercise.type === "MULTIPLE_CHOICE") {
    return {
      ...basePayload,
      options: exercise.options.map((option) => ({
        id: option.id,
        text: option.text,
        order: option.sortOrder,
      })),
    };
  }

  if (exercise.type === "FILL_BLANK") {
    return {
      ...basePayload,
      options: exercise.options.map((option) => ({
        id: option.id,
        text: option.text,
        order: option.sortOrder,
      })),
    };
  }

  return {
    ...basePayload,
    pairs: exercise.matchingPairs.map((pair) => ({
      id: pair.id,
      leftText: pair.leftText,
      rightText: pair.rightText,
      order: pair.sortOrder,
    })),
  };
};

async function getUnitExercises(unitId) {
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, isPublished: true, section: { isPublished: true } },
    select: { id: true },
  });

  if (!unit) {
    throw new ApiError(404, "UNIT_NOT_FOUND", "Unit not found");
  }

  const exercises = await prisma.exercise.findMany({
    where: { unitId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      options: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      matchingPairs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
    },
  });

  return exercises.map(toExercisePayload);
}

async function getFlashcards(unitId) {
  return prisma.flashcard.findMany({
    where: unitId ? { unitId } : undefined,
    orderBy: [{ unitId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      unitId: true,
      word: true,
      phonetic: true,
      meaning: true,
      imageUrl: true,
      sortOrder: true,
    },
  });
}

module.exports = {
  getFlashcards,
  getSections,
  getUnit,
  getUnitExercises,
};
