const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");
const { toSafeUserDto } = require("../utils/userDto");
const { applyLazyHeartRefill } = require("./heartService");

const BCRYPT_SALT_ROUNDS = 12;

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, "AUTH_CONFIG_MISSING", "Internal server error");
  }

  return process.env.JWT_SECRET;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function buildToken(user) {
  const payload = {
    sub: String(user.id),
    email: user.email,
  };

  return jwt.sign(payload, requireJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function parseAge(age) {
  if (age === undefined || age === null || age === "") {
    return null;
  }

  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 255) {
    throw new ApiError(400, "VALIDATION_ERROR", "Age must be a valid number");
  }

  return parsedAge;
}

function validateCredentials(email, password) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email and password are required");
  }

  return normalizedEmail;
}

async function register({ email, password, name, age }) {
  const normalizedEmail = validateCredentials(email, password);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const displayName = String(name || "").trim() || normalizedEmail.split("@")[0];

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: displayName,
      age: parseAge(age),
    },
  });

  return {
    token: buildToken(user),
    user: toSafeUserDto(user),
  };
}

async function login({ email, password }) {
  const normalizedEmail = validateCredentials(email, password);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const refilledUser = await applyLazyHeartRefill(prisma, user);

  return {
    token: buildToken(refilledUser),
    user: toSafeUserDto(refilledUser),
  };
}

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(401, "INVALID_TOKEN", "Token user no longer exists");
  }

  const refilledUser = await applyLazyHeartRefill(prisma, user);

  return toSafeUserDto(refilledUser);
}

module.exports = {
  getUserById,
  login,
  register,
};
