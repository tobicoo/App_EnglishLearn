const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");

const PLAN_DURATIONS_DAYS = {
  trial: 7,
  monthly: 30,
  yearly: 365,
};

const VALID_PAYMENT_METHODS = ["card", "paypal", "momo", "zalopay"];

function toSubscriptionDto(sub) {
  if (!sub) return null;
  const now = new Date();
  const isActive = sub.status === "ACTIVE" && new Date(sub.expiresAt) > now;
  return {
    id: sub.id,
    plan: sub.plan,
    status: isActive ? "ACTIVE" : sub.status,
    paymentMethod: sub.paymentMethod,
    startedAt: sub.startedAt,
    expiresAt: sub.expiresAt,
    isActive,
    daysRemaining: isActive
      ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0,
  };
}

async function getSubscription(userId) {
  const sub = await prisma.userSubscription.findUnique({ where: { userId } });
  return { subscription: toSubscriptionDto(sub) };
}

async function createOrRenewSubscription(userId, input) {
  const plan = String(input?.plan || "monthly").toLowerCase();
  if (!PLAN_DURATIONS_DAYS[plan]) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid plan. Choose: trial, monthly, yearly");
  }

  const paymentMethod = input?.paymentMethod && VALID_PAYMENT_METHODS.includes(input.paymentMethod)
    ? input.paymentMethod
    : null;

  const durationDays = PLAN_DURATIONS_DAYS[plan];
  const now = new Date();

  const existing = await prisma.userSubscription.findUnique({ where: { userId } });
  const baseDate = existing?.status === "ACTIVE" && new Date(existing.expiresAt) > now
    ? new Date(existing.expiresAt)
    : now;

  const expiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const sub = await prisma.userSubscription.upsert({
    where: { userId },
    update: { plan, status: "ACTIVE", paymentMethod, startedAt: now, expiresAt },
    create: { userId, plan, status: "ACTIVE", paymentMethod, startedAt: now, expiresAt },
  });

  return { subscription: toSubscriptionDto(sub) };
}

module.exports = { createOrRenewSubscription, getSubscription };
