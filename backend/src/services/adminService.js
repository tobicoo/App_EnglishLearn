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

  if (data.type && !["MULTIPLE_CHOICE", "FILL_BLANK", "MATCHING"].includes(data.type)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Exercise type is invalid");
  }

  return requireUpdateData(data);
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
  const options = parseOptionInputs(input?.options);
  const matchingPairs = parseMatchingPairInputs(input?.matchingPairs);
  const data = buildExerciseUpdate(input || {});
  delete data.options;
  delete data.matchingPairs;

  if (Object.keys(data).length === 0 && !options && !matchingPairs) {
    throw new ApiError(400, "VALIDATION_ERROR", "At least one field is required");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const exercise = await tx.exercise.update({
        where: { id: exerciseId },
        data,
        include: {
          options: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
          matchingPairs: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        },
      });

      if (options) {
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

module.exports = {
  getContent,
  getHeartbeatSetting,
  getUsers,
  resetUserPassword,
  resetUserProgress,
  updateExercise,
  updateHeartbeatSetting,
  updateSection,
  updateUnit,
};
