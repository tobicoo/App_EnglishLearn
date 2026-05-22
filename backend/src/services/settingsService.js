const prisma = require("../lib/prisma");
const ApiError = require("../utils/apiError");

const HEART_REFILL_INTERVAL_SECONDS_KEY = "heart_refill_interval_seconds";
const DEFAULT_HEART_REFILL_INTERVAL_SECONDS = 120;

let cachedHeartRefillIntervalSeconds = DEFAULT_HEART_REFILL_INTERVAL_SECONDS;

function parseHeartbeatIntervalSeconds(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 86400) {
    throw new ApiError(400, "VALIDATION_ERROR", "Heartbeat interval seconds must be between 1 and 86400");
  }

  return parsed;
}

function parseStoredHeartbeatIntervalSeconds(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 86400
    ? parsed
    : DEFAULT_HEART_REFILL_INTERVAL_SECONDS;
}

async function getHeartRefillIntervalSeconds() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: HEART_REFILL_INTERVAL_SECONDS_KEY },
  });

  if (!setting) {
    await prisma.appSetting.create({
      data: {
        key: HEART_REFILL_INTERVAL_SECONDS_KEY,
        value: String(DEFAULT_HEART_REFILL_INTERVAL_SECONDS),
      },
    });
    cachedHeartRefillIntervalSeconds = DEFAULT_HEART_REFILL_INTERVAL_SECONDS;
    return cachedHeartRefillIntervalSeconds;
  }

  cachedHeartRefillIntervalSeconds = parseStoredHeartbeatIntervalSeconds(setting.value);
  return cachedHeartRefillIntervalSeconds;
}

function getHeartRefillIntervalSecondsSync() {
  return cachedHeartRefillIntervalSeconds;
}

async function updateHeartRefillIntervalSeconds(value) {
  const seconds = parseHeartbeatIntervalSeconds(value);

  await prisma.appSetting.upsert({
    where: { key: HEART_REFILL_INTERVAL_SECONDS_KEY },
    update: { value: String(seconds) },
    create: {
      key: HEART_REFILL_INTERVAL_SECONDS_KEY,
      value: String(seconds),
    },
  });

  cachedHeartRefillIntervalSeconds = seconds;
  return seconds;
}

module.exports = {
  DEFAULT_HEART_REFILL_INTERVAL_SECONDS,
  HEART_REFILL_INTERVAL_SECONDS_KEY,
  getHeartRefillIntervalSeconds,
  getHeartRefillIntervalSecondsSync,
  updateHeartRefillIntervalSeconds,
};
