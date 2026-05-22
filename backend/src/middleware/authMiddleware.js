const jwt = require("jsonwebtoken");

const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");

function getBearerToken(req) {
  const authorization = req.get("authorization");

  if (!authorization) {
    throw new ApiError(401, "MISSING_TOKEN", "Bearer token is required");
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "MALFORMED_TOKEN", "Authorization header must use Bearer token");
  }

  return token;
}

function authenticateJwt(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, "AUTH_CONFIG_MISSING", "Internal server error");
    }

    const token = getBearerToken(req);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      throw new ApiError(401, "MALFORMED_TOKEN", "Token subject is invalid");
    }

    req.auth = {
      userId,
      email: payload.email,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(401, "MALFORMED_TOKEN", "Token is invalid or expired"));
  }
}

async function requireAdmin(req, res, next) {
  try {
    if (!req.auth?.userId) {
      throw new ApiError(401, "MISSING_TOKEN", "Bearer token is required");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new ApiError(401, "INVALID_TOKEN", "Token user no longer exists");
    }

    if (user.role !== "ADMIN") {
      throw new ApiError(403, "ADMIN_REQUIRED", "Admin access is required");
    }

    req.auth.role = user.role;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateJwt,
  requireAdmin,
};
