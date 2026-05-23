const bcrypt = require("bcrypt");

const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");
const { toSafeUserDto } = require("../utils/userDto");
const {
  getHeartRefillIntervalSeconds,
  updateHeartRefillIntervalSeconds,
} = require("./settingsService");

const BCRYPT_SALT_ROUNDS = 12;

const SECTION_FIELDS = new Set(["title", "subtitle", "subTitle", "sortOrder", "isPublished"]);
const UNIT_FIELDS = new Set(["sectionId", "title", "description", "kind", "sortOrder", "xpReward", "isPublished"]);
const EXERCISE_FIELDS = new Set(["unitId", "type", "prompt", "answerText", "correctOptionId", "explanation", "sortOrder", "xpReward", "options", "matchingPairs"]);
const FLASHCARD_FIELDS = new Set(["unitId", "word", "phonetic", "meaning", "imageUrl", "sortOrder"]);
const EXERCISE_TYPES = new Set(["MULTIPLE_CHOICE", "FILL_BLANK", "MATCHING"]);
const OPTION_BASED_EXERCISE_TYPES = new Set(["MULTIPLE_CHOICE"]);
const DEFAULT_MATCHING_PROMPT = "Nối các cặp phù hợp";

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a positive integer`);
  }

  return parsed;
}

function normalizeIdParam(value, entityName) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new ApiError(404, `${entityName.toUpperCase()}_NOT_FOUND`, `${entityName} not found`);
  }

  return Number(value);
}

function ensureKnownFields(input, allowedFields) {
  for (const field of Object.keys(input || {})) {
    if (!allowedFields.has(field)) {
      throw new ApiError(400, "VALIDATION_ERROR", `${field} cannot be updated`);
    }
  }
}

function parseOptionalString(value, fieldName, { maxLength, nullable = false, trim = true }) {
  if (value === undefined) return undefined;
  if (value === null) {
    if (nullable) return null;
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a string`);
  }

  const parsed = trim ? String(value).trim() : String(value);
  if (!parsed && !nullable) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is required`);
  }

  if (parsed.length > maxLength) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is too long`);
  }

  return parsed || null;
}

function parseOptionalBoolean(value, fieldName) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a boolean`);
  }

  return value;
}

function parseOptionalPositiveInt(value, fieldName) {
  if (value === undefined) return undefined;
  return parsePositiveInt(value, fieldName);
}

function requireUpdateData(data) {
  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "At least one field is required");
  }

  return data;
}

function normalizeExerciseType(value) {
  const type = String(value || "").toUpperCase();
  if (!EXERCISE_TYPES.has(type)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Exercise type is invalid");
  }

  return type;
}

function buildSectionUpdate(input) {
  ensureKnownFields(input, SECTION_FIELDS);
  const data = {};

  if (Object.prototype.hasOwnProperty.call(input, "title")) {
    data.title = parseOptionalString(input.title, "Title", { maxLength: 120 });
  }
  if (Object.prototype.hasOwnProperty.call(input, "subtitle") || Object.prototype.hasOwnProperty.call(input, "subTitle")) {
    data.subtitle = parseOptionalString(input.subtitle ?? input.subTitle, "Subtitle", { maxLength: 255, nullable: true });
  }
  if (Object.prototype.hasOwnProperty.call(input, "sortOrder")) {
    data.sortOrder = parseOptionalPositiveInt(input.sortOrder, "Sort order");
  }
  if (Object.prototype.hasOwnProperty.call(input, "isPublished")) {
    data.isPublished = parseOptionalBoolean(input.isPublished, "Published flag");
  }

  return data;
}

function buildUnitUpdate(input) {
  ensureKnownFields(input, UNIT_FIELDS);
  const data = {};

  if (Object.prototype.hasOwnProperty.call(input, "sectionId")) data.sectionId = parsePositiveInt(input.sectionId, "Section id");
  if (Object.prototype.hasOwnProperty.call(input, "title")) data.title = parseOptionalString(input.title, "Title", { maxLength: 160, nullable: true });
  if (Object.prototype.hasOwnProperty.call(input, "description")) data.description = parseOptionalString(input.description, "Description", { maxLength: 65535, nullable: true, trim: false });
  if (Object.prototype.hasOwnProperty.call(input, "kind")) data.kind = String(input.kind || "").toUpperCase();
  if (Object.prototype.hasOwnProperty.call(input, "sortOrder")) data.sortOrder = parsePositiveInt(input.sortOrder, "Sort order");
  if (Object.prototype.hasOwnProperty.call(input, "xpReward")) data.xpReward = parsePositiveInt(input.xpReward, "XP reward");
  if (Object.prototype.hasOwnProperty.call(input, "isPublished")) data.isPublished = parseOptionalBoolean(input.isPublished, "Published flag");

  if (data.kind && !["LESSON", "REVIEW", "CHECKPOINT"].includes(data.kind)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Unit kind is invalid");
  }

  return requireUpdateData(data);
}

function buildExerciseUpdate(input) {
  ensureKnownFields(input, EXERCISE_FIELDS);
  const data = {};

  if (Object.prototype.hasOwnProperty.call(input, "unitId")) data.unitId = parsePositiveInt(input.unitId, "Unit id");
  if (Object.prototype.hasOwnProperty.call(input, "type")) data.type = String(input.type || "").toUpperCase();
  if (Object.prototype.hasOwnProperty.call(input, "prompt")) data.prompt = parseOptionalString(input.prompt, "Prompt", { maxLength: 65535, trim: false });
  if (Object.prototype.hasOwnProperty.call(input, "answerText")) data.answerText = parseOptionalString(input.answerText, "Answer text", { maxLength: 65535, nullable: true, trim: false });
  if (Object.prototype.hasOwnProperty.call(input, "correctOptionId")) data.correctOptionId = input.correctOptionId === null ? null : parsePositiveInt(input.correctOptionId, "Correct option id");
  if (Object.prototype.hasOwnProperty.call(input, "explanation")) data.explanation = parseOptionalString(input.explanation, "Explanation", { maxLength: 65535, nullable: true, trim: false });
  if (Object.prototype.hasOwnProperty.call(input, "sortOrder")) data.sortOrder = parsePositiveInt(input.sortOrder, "Sort order");
  if (Object.prototype.hasOwnProperty.call(input, "xpReward")) data.xpReward = parsePositiveInt(input.xpReward, "XP reward");

  if (data.type) normalizeExerciseType(data.type);

  return data;
}

function parseOptionInputs(options) {
  if (options === undefined) return undefined;
  if (!Array.isArray(options) || options.length < 2) {
    throw new ApiError(400, "VALIDATION_ERROR", "Options must include at least two items");
  }

  return options.map((option, index) => ({
    id: option?.id ? parsePositiveInt(option.id, "Option id") : null,
    text: parseOptionalString(option?.text, "Option text", { maxLength: 65535, trim: false }),
    sortOrder: index + 1,
    isCorrect: option?.isCorrect === true,
  }));
}

function parseMatchingPairInputs(pairs) {
  if (pairs === undefined) return undefined;
  if (!Array.isArray(pairs) || pairs.length < 1) {
    throw new ApiError(400, "VALIDATION_ERROR", "Matching pairs must include at least one item");
  }

  return pairs.map((pair, index) => ({
    id: pair?.id ? parsePositiveInt(pair.id, "Matching pair id") : null,
    leftText: parseOptionalString(pair?.leftText, "Left text", { maxLength: 255 }),
    rightText: parseOptionalString(pair?.rightText, "Right text", { maxLength: 255 }),
    sortOrder: index + 1,
  }));
}

function parseRequiredString(value, fieldName, { maxLength, trim = true }) {
  const parsed = trim ? String(value || "").trim() : String(value || "");
  if (!parsed) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is required`);
  }
  if (parsed.length > maxLength) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is too long`);
  }
  return parsed;
}

async function createSection(input) {
  const title = parseRequiredString(input?.title, "Title", { maxLength: 120 });
  const subtitle = parseOptionalString(input?.subtitle, "Subtitle", { maxLength: 255, nullable: true });
  const sortOrder = Number.isInteger(Number(input?.sortOrder)) && Number(input?.sortOrder) >= 1
    ? Number(input.sortOrder)
    : null;
  const isPublished = typeof input?.isPublished === "boolean" ? input.isPublished : true;

  const data = { title, subtitle, isPublished };
  if (sortOrder) {
    data.sortOrder = sortOrder;
  } else {
    const maxSection = await prisma.section.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    data.sortOrder = (maxSection?.sortOrder ?? 0) + 1;
  }

  return prisma.section.create({ data });
}

async function createUnit(input) {
  const sectionId = parsePositiveInt(input?.sectionId, "Section id");
  const title = parseOptionalString(input?.title, "Title", { maxLength: 160, nullable: true });
  const description = parseOptionalString(input?.description, "Description", { maxLength: 65535, nullable: true, trim: false });
  const kind = String(input?.kind || "LESSON").toUpperCase();
  const sortOrder = Number.isInteger(Number(input?.sortOrder)) && Number(input?.sortOrder) >= 1
    ? Number(input.sortOrder)
    : null;
  const xpReward = Number.isInteger(Number(input?.xpReward)) && Number(input?.xpReward) >= 1
    ? Number(input.xpReward)
    : 20;
  const isPublished = typeof input?.isPublished === "boolean" ? input.isPublished : true;

  if (!["LESSON", "REVIEW", "CHECKPOINT"].includes(kind)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Unit kind is invalid");
  }

  const data = { sectionId, title, description, kind, xpReward, isPublished };
  if (sortOrder) data.sortOrder = sortOrder;

  return prisma.unit.create({ data });
}

async function createExercise(input) {
  const unitId = parsePositiveInt(input?.unitId, "Unit id");
  const type = normalizeExerciseType(input?.type);
  const prompt = type === "MATCHING"
    ? DEFAULT_MATCHING_PROMPT
    : parseRequiredString(input?.prompt, "Prompt", { maxLength: 65535, trim: false });
  const answerText = type === "MATCHING"
    ? null
    : parseOptionalString(input?.answerText, "Answer text", { maxLength: 65535, nullable: true, trim: false });
  const explanation = parseOptionalString(input?.explanation, "Explanation", { maxLength: 65535, nullable: true, trim: false });
  const sortOrder = Number.isInteger(Number(input?.sortOrder)) && Number(input?.sortOrder) >= 1
    ? Number(input.sortOrder)
    : null;
  const xpReward = Number.isInteger(Number(input?.xpReward)) && Number(input?.xpReward) >= 1
    ? Number(input.xpReward)
    : 5;

  const options = OPTION_BASED_EXERCISE_TYPES.has(type) ? parseOptionInputs(input?.options) : undefined;
  const matchingPairs = type === "MATCHING" ? parseMatchingPairInputs(input?.matchingPairs) : undefined;
  if (type === "MATCHING" && !matchingPairs) {
    throw new ApiError(400, "VALIDATION_ERROR", "Matching exercises require at least one matching pair");
  }

  const data = { unitId, type, prompt, answerText, explanation, xpReward };
  if (sortOrder) data.sortOrder = sortOrder;

  return prisma.$transaction(async (tx) => {
    const exercise = await tx.exercise.create({ data });

    if (options) {
      let correctOptionId = null;
      for (const option of options) {
        const savedOption = await tx.exerciseOption.create({
          data: { exerciseId: exercise.id, text: option.text, sortOrder: option.sortOrder },
        });
        if (option.isCorrect) correctOptionId = savedOption.id;
      }
      if (!correctOptionId) {
        throw new ApiError(400, "VALIDATION_ERROR", "One option must be marked correct");
      }
      await tx.exercise.update({ where: { id: exercise.id }, data: { correctOptionId } });
    }

    if (matchingPairs) {
      for (const pair of matchingPairs) {
        await tx.matchingPair.create({
          data: { exerciseId: exercise.id, leftText: pair.leftText, rightText: pair.rightText, sortOrder: pair.sortOrder },
        });
      }
    }

    return tx.exercise.findUnique({
      where: { id: exercise.id },
      include: {
        options: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        matchingPairs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
      },
    });
  });
}

function buildFlashcardUpdate(input) {
  ensureKnownFields(input, FLASHCARD_FIELDS);
  const data = {};

  if (Object.prototype.hasOwnProperty.call(input, "unitId")) data.unitId = parsePositiveInt(input.unitId, "Unit id");
  if (Object.prototype.hasOwnProperty.call(input, "word")) data.word = parseOptionalString(input.word, "Word", { maxLength: 120 });
  if (Object.prototype.hasOwnProperty.call(input, "phonetic")) data.phonetic = parseOptionalString(input.phonetic, "Phonetic", { maxLength: 120, nullable: true });
  if (Object.prototype.hasOwnProperty.call(input, "meaning")) data.meaning = parseOptionalString(input.meaning, "Meaning", { maxLength: 255 });
  if (Object.prototype.hasOwnProperty.call(input, "imageUrl")) data.imageUrl = parseOptionalString(input.imageUrl, "Image URL", { maxLength: 500, nullable: true });
  if (Object.prototype.hasOwnProperty.call(input, "sortOrder")) data.sortOrder = parsePositiveInt(input.sortOrder, "Sort order");

  return requireUpdateData(data);
}

async function createFlashcard(input) {
  const unitId = parsePositiveInt(input?.unitId, "Unit id");
  const word = parseRequiredString(input?.word, "Word", { maxLength: 120 });
  const phonetic = parseOptionalString(input?.phonetic, "Phonetic", { maxLength: 120, nullable: true });
  const meaning = parseRequiredString(input?.meaning, "Meaning", { maxLength: 255 });
  const imageUrl = parseOptionalString(input?.imageUrl, "Image URL", { maxLength: 500, nullable: true });
  const sortOrder = Number.isInteger(Number(input?.sortOrder)) && Number(input?.sortOrder) >= 1
    ? Number(input.sortOrder)
    : null;

  const data = { unitId, word, phonetic, meaning, imageUrl };
  if (sortOrder) data.sortOrder = sortOrder;

  return prisma.flashcard.create({ data });
}

async function updateFlashcard(id, input) {
  const flashcardId = normalizeIdParam(id, "Flashcard");
  try {
    return await prisma.flashcard.update({ where: { id: flashcardId }, data: buildFlashcardUpdate(input || {}) });
  } catch (error) {
    if (error.code === "P2025") throw new ApiError(404, "FLASHCARD_NOT_FOUND", "Flashcard not found");
    throw error;
  }
}

async function deleteFlashcard(id) {
  const flashcardId = normalizeIdParam(id, "Flashcard");
  return prisma.$transaction(async (tx) => {
    const flashcard = await tx.flashcard.findUnique({ where: { id: flashcardId } });
    if (!flashcard) throw new ApiError(404, "FLASHCARD_NOT_FOUND", "Flashcard not found");
    await tx.flashcard.delete({ where: { id: flashcardId } });
  });
}

async function deleteSection(id) {
  const sectionId = normalizeIdParam(id, "Section");
  return prisma.$transaction(async (tx) => {
    const section = await tx.section.findUnique({ where: { id: sectionId } });
    if (!section) throw new ApiError(404, "SECTION_NOT_FOUND", "Section not found");
    const units = await tx.unit.findMany({ where: { sectionId }, select: { id: true } });
    for (const unit of units) {
      await tx.unit.delete({ where: { id: unit.id } });
    }
    await tx.section.delete({ where: { id: sectionId } });
  });
}

async function deleteUnit(id) {
  const unitId = normalizeIdParam(id, "Unit");
  return prisma.$transaction(async (tx) => {
    const unit = await tx.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new ApiError(404, "UNIT_NOT_FOUND", "Unit not found");
    await tx.unit.delete({ where: { id: unitId } });
  });
}

async function deleteExercise(id) {
  const exerciseId = normalizeIdParam(id, "Exercise");
  return prisma.$transaction(async (tx) => {
    const exercise = await tx.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) throw new ApiError(404, "EXERCISE_NOT_FOUND", "Exercise not found");
    await tx.exercise.delete({ where: { id: exerciseId } });
  });
}

async function getHeartbeatSetting() {
  return { heartRefillIntervalSeconds: await getHeartRefillIntervalSeconds() };
}

async function updateHeartbeatSetting(input) {
  const seconds = await updateHeartRefillIntervalSeconds(input?.heartRefillIntervalSeconds ?? input?.seconds);
  return { heartRefillIntervalSeconds: seconds };
}

async function getContent() {
  const sections = await prisma.section.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      units: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: {
          flashcards: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          exercises: {
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
            include: {
              options: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
              matchingPairs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
            },
          },
        },
      },
    },
  });

  return sections;
}

async function updateSection(id, input) {
  const sectionId = normalizeIdParam(id, "Section");
  try {
    return await prisma.section.update({ where: { id: sectionId }, data: buildSectionUpdate(input || {}) });
  } catch (error) {
    if (error.code === "P2025") throw new ApiError(404, "SECTION_NOT_FOUND", "Section not found");
    throw error;
  }
}

async function updateUnit(id, input) {
  const unitId = normalizeIdParam(id, "Unit");
  try {
    return await prisma.unit.update({ where: { id: unitId }, data: buildUnitUpdate(input || {}) });
  } catch (error) {
    if (error.code === "P2025") throw new ApiError(404, "UNIT_NOT_FOUND", "Unit not found");
    throw error;
  }
}

async function updateExercise(id, input) {
  const exerciseId = normalizeIdParam(id, "Exercise");
  const data = buildExerciseUpdate(input || {});
  delete data.options;
  delete data.matchingPairs;

  try {
    return await prisma.$transaction(async (tx) => {
      const existingExercise = await tx.exercise.findUnique({ where: { id: exerciseId } });
      if (!existingExercise) throw new ApiError(404, "EXERCISE_NOT_FOUND", "Exercise not found");

      const targetType = data.type ? normalizeExerciseType(data.type) : existingExercise.type;
      if (targetType === "MATCHING") {
        data.prompt = DEFAULT_MATCHING_PROMPT;
        data.answerText = null;
      }
      if (targetType === "MULTIPLE_CHOICE") {
        data.answerText = null;
      }
      const options = OPTION_BASED_EXERCISE_TYPES.has(targetType) ? parseOptionInputs(input?.options) : undefined;
      const matchingPairs = targetType === "MATCHING" ? parseMatchingPairInputs(input?.matchingPairs) : undefined;

      if (targetType === "MATCHING" && Object.prototype.hasOwnProperty.call(input || {}, "options")) {
        throw new ApiError(400, "VALIDATION_ERROR", "Matching exercises cannot include options");
      }
      if (OPTION_BASED_EXERCISE_TYPES.has(targetType) && Object.prototype.hasOwnProperty.call(input || {}, "matchingPairs")) {
        throw new ApiError(400, "VALIDATION_ERROR", "Only matching exercises can include matching pairs");
      }
      if (targetType === "MATCHING" && !matchingPairs && existingExercise.type !== "MATCHING") {
        throw new ApiError(400, "VALIDATION_ERROR", "Matching exercises require at least one matching pair");
      }
      if (OPTION_BASED_EXERCISE_TYPES.has(targetType) && !options && existingExercise.type === "MATCHING") {
        throw new ApiError(400, "VALIDATION_ERROR", "Option-based exercises require options when converting from matching");
      }
      if (Object.keys(data).length === 0 && !options && !matchingPairs) {
        throw new ApiError(400, "VALIDATION_ERROR", "At least one field is required");
      }

      const exercise = await tx.exercise.update({
        where: { id: exerciseId },
        data,
        include: {
          options: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          matchingPairs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        },
      });

      if (targetType === "MATCHING") {
        await tx.exercise.update({ where: { id: exerciseId }, data: { correctOptionId: null } });
        await tx.exerciseOption.deleteMany({ where: { exerciseId } });
      } else if (targetType === "FILL_BLANK") {
        await tx.exercise.update({ where: { id: exerciseId }, data: { correctOptionId: null } });
        await tx.exerciseOption.deleteMany({ where: { exerciseId } });
        await tx.matchingPair.deleteMany({ where: { exerciseId } });
      } else {
        await tx.matchingPair.deleteMany({ where: { exerciseId } });
      }

      if (options) {
        const optionIds = options.map((option) => option.id).filter(Boolean);
        if (optionIds.length > 0) {
          const ownedOptions = await tx.exerciseOption.count({ where: { exerciseId, id: { in: optionIds } } });
          if (ownedOptions !== optionIds.length) {
            throw new ApiError(400, "VALIDATION_ERROR", "Options must belong to the exercise being updated");
          }
        }

        await tx.exercise.update({ where: { id: exerciseId }, data: { correctOptionId: null } });
        const keptOptionIds = [];
        let correctOptionId = null;
        for (const option of options) {
          const savedOption = option.id
            ? await tx.exerciseOption.update({ where: { id: option.id }, data: { text: option.text, sortOrder: option.sortOrder } })
            : await tx.exerciseOption.create({ data: { exerciseId, text: option.text, sortOrder: option.sortOrder } });
          keptOptionIds.push(savedOption.id);
          if (option.isCorrect) correctOptionId = savedOption.id;
        }

        if (!correctOptionId) {
          throw new ApiError(400, "VALIDATION_ERROR", "One option must be marked correct");
        }

        await tx.exerciseOption.deleteMany({ where: { exerciseId, id: { notIn: keptOptionIds } } });
        await tx.exercise.update({ where: { id: exerciseId }, data: { correctOptionId } });
      }

      if (matchingPairs) {
        const pairIds = matchingPairs.map((pair) => pair.id).filter(Boolean);
        if (pairIds.length > 0) {
          const ownedPairs = await tx.matchingPair.count({ where: { exerciseId, id: { in: pairIds } } });
          if (ownedPairs !== pairIds.length) {
            throw new ApiError(400, "VALIDATION_ERROR", "Matching pairs must belong to the exercise being updated");
          }
        }

        const keptPairIds = [];
        for (const pair of matchingPairs) {
          const savedPair = pair.id
            ? await tx.matchingPair.update({ where: { id: pair.id }, data: { leftText: pair.leftText, rightText: pair.rightText, sortOrder: pair.sortOrder } })
            : await tx.matchingPair.create({ data: { exerciseId, leftText: pair.leftText, rightText: pair.rightText, sortOrder: pair.sortOrder } });
          keptPairIds.push(savedPair.id);
        }
        await tx.matchingPair.deleteMany({ where: { exerciseId, id: { notIn: keptPairIds } } });
      }

      return tx.exercise.findUnique({
        where: { id: exercise.id },
        include: {
          options: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          matchingPairs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        },
      });
    });
  } catch (error) {
    if (error.code === "P2025") throw new ApiError(404, "EXERCISE_NOT_FOUND", "Exercise not found");
    throw error;
  }
}

async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return users.map(toSafeUserDto);
}

async function resetUserPassword(id, input) {
  const userId = normalizeIdParam(id, "User");
  const newPassword = String(input?.newPassword || input?.password || "");
  if (newPassword.length < 6) {
    throw new ApiError(400, "VALIDATION_ERROR", "New password must be at least 6 characters");
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  try {
    const user = await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return toSafeUserDto(user);
  } catch (error) {
    if (error.code === "P2025") throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    throw error;
  }
}

async function resetUserProgress(id) {
  const userId = normalizeIdParam(id, "User");

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    await tx.exerciseAttempt.deleteMany({ where: { userId } });
    await tx.xpLedger.deleteMany({ where: { userId } });
    await tx.unitAttempt.deleteMany({ where: { userId } });
    await tx.userUnitProgress.deleteMany({ where: { userId } });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        level: 1,
        totalXp: 0,
        streak: 0,
        gems: 0,
        hearts: 5,
        maxHearts: 5,
        heartRefilledAt: new Date(),
      },
    });

    return toSafeUserDto(updatedUser);
  });
}

const PLAN_MONTHLY_PRICE = 12.12;
const PLAN_YEARLY_PRICE = 99.99;

function planPrice(plan) {
  if (plan === "yearly") return PLAN_YEARLY_PRICE;
  if (plan === "monthly") return PLAN_MONTHLY_PRICE;
  return 0;
}

async function getStats() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const yearStart = new Date(currentYear, 0, 1);
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  const [
    totalUsers,
    newUsersThisMonth,
    avgScoreResult,
    completedAttempts,
    allSubscriptions,
    newSubscriptionsThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.unitAttempt.aggregate({
      where: { status: "COMPLETED" },
      _avg: { score: true },
      _count: true,
    }),
    prisma.unitAttempt.findMany({
      where: { status: "COMPLETED", completedAt: { gte: yearStart } },
      select: { completedAt: true },
    }),
    prisma.userSubscription.findMany({
      where: { status: "ACTIVE" },
      select: { plan: true, startedAt: true, expiresAt: true },
    }),
    prisma.userSubscription.findMany({
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
      select: { plan: true },
    }),
  ]);

  const monthlyAttempts = Array(12).fill(0);
  for (const a of completedAttempts) {
    if (a.completedAt) {
      const m = new Date(a.completedAt).getMonth();
      monthlyAttempts[m] += 1;
    }
  }

  const totalRevenueAllTime = allSubscriptions.reduce((sum, s) => sum + planPrice(s.plan), 0);
  const revenueThisMonth = newSubscriptionsThisMonth.reduce((sum, s) => sum + planPrice(s.plan), 0);

  const planCounts = { monthly: 0, yearly: 0, trial: 0 };
  for (const s of allSubscriptions) planCounts[s.plan] = (planCounts[s.plan] || 0) + 1;
  const totalActive = allSubscriptions.length;
  const revenueByType = totalActive === 0 ? [] : [
    { label: "Monthly", pct: Math.round((planCounts.monthly / totalActive) * 100), color: "#1cb0f6" },
    { label: "Yearly", pct: Math.round((planCounts.yearly / totalActive) * 100), color: "#CE82FF" },
    { label: "Trial", pct: Math.round((planCounts.trial / totalActive) * 100), color: "#ffc800" },
  ];

  return {
    totalUsers,
    newUsersThisMonth,
    totalCompletedAttempts: avgScoreResult._count,
    avgScore: avgScoreResult._avg.score ? Math.round(avgScoreResult._avg.score * 10) / 10 : 0,
    monthlyAttempts,
    activeSubscriptions: totalActive,
    revenueThisMonth: revenueThisMonth.toFixed(2),
    totalRevenue: totalRevenueAllTime.toFixed(2),
    revenueByType,
  };
}

async function getActivityLog({ limit = 30 } = {}) {
  const take = Math.min(Number(limit) || 30, 100);

  const [recentAttempts, recentUsers, recentExams] = await Promise.all([
    prisma.unitAttempt.findMany({
      where: { status: "COMPLETED" },
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      take,
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { title: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.exam.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10,
      include: { creator: { select: { name: true } } },
    }),
  ]);

  const logs = [];

  for (const attempt of recentAttempts) {
    logs.push({
      id: `attempt-${attempt.id}`,
      icon: "📚",
      action: "Bài học hoàn thành",
      detail: `${attempt.user.name} · ${attempt.unit?.title || `Unit #${attempt.unitId}`} · ${attempt.score}%`,
      time: attempt.completedAt,
      type: "learning",
    });
  }

  for (const user of recentUsers) {
    logs.push({
      id: `user-${user.id}`,
      icon: user.role === "ADMIN" ? "🔐" : "👤",
      action: user.role === "ADMIN" ? "Tài khoản Admin được tạo" : "Tài khoản mới được tạo",
      detail: user.email,
      time: user.createdAt,
      type: "user",
    });
  }

  for (const exam of recentExams) {
    logs.push({
      id: `exam-${exam.id}`,
      icon: "📝",
      action: "Đề thi được tạo",
      detail: `${exam.title} · ${exam.creator?.name || "Unknown"}`,
      time: exam.createdAt,
      type: "exam",
    });
  }

  logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return logs.slice(0, take);
}

module.exports = {
  createExercise,
  createFlashcard,
  createSection,
  createUnit,
  deleteExercise,
  deleteFlashcard,
  deleteSection,
  deleteUnit,
  getActivityLog,
  getContent,
  getHeartbeatSetting,
  getStats,
  getUsers,
  resetUserPassword,
  resetUserProgress,
  updateExercise,
  updateFlashcard,
  updateHeartbeatSetting,
  updateSection,
  updateUnit,
};
