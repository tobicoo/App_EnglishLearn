const bcrypt = require("bcrypt");

const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");
const { toLeaderboardEntryDto, toSafeUserDto } = require("../utils/userDto");

const BCRYPT_SALT_ROUNDS = 12;

const ALLOWED_PROFILE_FIELDS = new Set(["name", "age", "avatar"]);
const FORBIDDEN_PROFILE_FIELDS = new Set([
  "completedUnitIds",
  "email",
  "gems",
  "hearts",
  "level",
  "maxHearts",
  "password",
  "passwordHash",
  "progress",
  "streak",
  "totalXp",
  "unitProgress",
  "xp",
  "xpLedger",
]);

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function parseOptionalAge(age) {
  if (age === undefined) {
    return undefined;
  }

  if (age === null || age === "") {
    return null;
  }

  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 255) {
    throw new ApiError(400, "VALIDATION_ERROR", "Age must be a valid number");
  }

  return parsedAge;
}

function parseOptionalString(value, fieldName, { maxLength, nullable = false }) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    if (nullable) {
      return null;
    }

    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} must be a string`);
  }

  const parsedValue = String(value).trim();
  if (!parsedValue && !nullable) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is required`);
  }

  if (parsedValue.length > maxLength) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is too long`);
  }

  return parsedValue || null;
}

function buildProfileUpdate(input) {
  const update = {};

  for (const field of Object.keys(input)) {
    if (FORBIDDEN_PROFILE_FIELDS.has(field)) {
      throw new ApiError(400, "PROFILE_FIELD_NOT_ALLOWED", `${field} cannot be updated from profile settings`);
    }

    if (!ALLOWED_PROFILE_FIELDS.has(field)) {
      throw new ApiError(400, "PROFILE_FIELD_NOT_ALLOWED", `${field} cannot be updated from profile settings`);
    }
  }

  if (hasOwn(input, "name")) {
    update.name = parseOptionalString(input.name, "Name", { maxLength: 100 });
  }

  if (hasOwn(input, "age")) {
    update.age = parseOptionalAge(input.age);
  }

  if (hasOwn(input, "avatar")) {
    update.avatar = parseOptionalString(input.avatar, "Avatar", { maxLength: 32, nullable: true });
  }

  if (Object.keys(update).length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "At least one profile field is required");
  }

  return update;
}

async function getLeaderboard() {
  const users = await prisma.user.findMany({
    orderBy: [
      { totalXp: "desc" },
      { name: "asc" },
      { id: "asc" },
    ],
  });

  return users.map((user, index) => toLeaderboardEntryDto(user, index + 1));
}

async function updateCurrentUserProfile(userId, input) {
  const data = buildProfileUpdate(input || {});

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return toSafeUserDto(user);
}

async function changeCurrentUserPassword(userId, input) {
  const currentPassword = String(input?.currentPassword || "");
  const newPassword = String(input?.newPassword || "");

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "VALIDATION_ERROR", "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "VALIDATION_ERROR", "New password must be at least 6 characters");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(401, "INVALID_TOKEN", "Token user no longer exists");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return toSafeUserDto(updatedUser);
}

module.exports = {
  changeCurrentUserPassword,
  getLeaderboard,
  updateCurrentUserProfile,
};
