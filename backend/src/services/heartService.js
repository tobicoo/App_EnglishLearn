const { getHeartRefillIntervalSeconds, getHeartRefillIntervalSecondsSync } = require("./settingsService");

const DEFAULT_HEART_REFILL_INTERVAL_SECONDS = 120;

function getHeartRefillIntervalMs(intervalSeconds = getHeartRefillIntervalSecondsSync()) {
  return intervalSeconds * 1000;
}

function getHeartRefilledAt(user, now) {
  const heartRefilledAt = user.heartRefilledAt ? new Date(user.heartRefilledAt) : now;
  return heartRefilledAt.getTime() > now.getTime() ? now : heartRefilledAt;
}

function computeLazyHeartRefill(user, now = new Date(), intervalSeconds = getHeartRefillIntervalSecondsSync()) {
  const maxHearts = Math.max(Number(user.maxHearts) || 0, 0);
  const currentHearts = Math.min(Math.max(Number(user.hearts) || 0, 0), maxHearts);
  const rawHeartRefilledAt = user.heartRefilledAt ? new Date(user.heartRefilledAt) : now;
  const heartRefilledAt = getHeartRefilledAt(user, now);
  const didNormalizeRefillTime = rawHeartRefilledAt.getTime() !== heartRefilledAt.getTime();

  if (currentHearts >= maxHearts) {
    return {
      hearts: currentHearts,
      maxHearts,
      heartRefilledAt: now,
      heartsRefilled: 0,
      didRefill: didNormalizeRefillTime,
    };
  }

  const elapsedMs = Math.max(now.getTime() - heartRefilledAt.getTime(), 0);
  const heartRefillIntervalMs = getHeartRefillIntervalMs(intervalSeconds);
  const heartsRefilled = Math.min(Math.floor(elapsedMs / heartRefillIntervalMs), maxHearts - currentHearts);

  if (heartsRefilled <= 0) {
    return {
      hearts: currentHearts,
      maxHearts,
      heartRefilledAt,
      heartsRefilled: 0,
      didRefill: didNormalizeRefillTime,
    };
  }

  const hearts = currentHearts + heartsRefilled;
  return {
    hearts,
    maxHearts,
    heartRefilledAt: hearts >= maxHearts
      ? now
      : new Date(heartRefilledAt.getTime() + heartsRefilled * heartRefillIntervalMs),
    heartsRefilled,
    didRefill: true,
  };
}

async function applyLazyHeartRefill(tx, user, now = new Date()) {
  const intervalSeconds = await getHeartRefillIntervalSeconds();
  const refill = computeLazyHeartRefill(user, now, intervalSeconds);

  if (!refill.didRefill) {
    return { ...user, hearts: refill.hearts, maxHearts: refill.maxHearts, heartRefilledAt: refill.heartRefilledAt };
  }

  return tx.user.update({
    where: { id: user.id },
    data: {
      hearts: refill.hearts,
      heartRefilledAt: refill.heartRefilledAt,
    },
  });
}

function buildHeartMetadata(user, now = new Date()) {
  const intervalSeconds = getHeartRefillIntervalSecondsSync();
  const refill = computeLazyHeartRefill(user, now, intervalSeconds);
  const heartRefillIntervalMs = getHeartRefillIntervalMs(intervalSeconds);
  const nextHeartAt = refill.hearts >= refill.maxHearts
    ? null
    : new Date(refill.heartRefilledAt.getTime() + heartRefillIntervalMs);
  const secondsUntilNextHeart = nextHeartAt
    ? Math.max(Math.ceil((nextHeartAt.getTime() - now.getTime()) / 1000), 0)
    : 0;

  return {
    hearts: refill.hearts,
    maxHearts: refill.maxHearts,
    heartRefilledAt: refill.heartRefilledAt,
    nextHeartAt,
    secondsUntilNextHeart,
    minutesUntilNextHeart: Math.ceil(secondsUntilNextHeart / 60),
    heartRefillIntervalSeconds: intervalSeconds,
  };
}

module.exports = {
  DEFAULT_HEART_REFILL_INTERVAL_SECONDS,
  applyLazyHeartRefill,
  buildHeartMetadata,
  computeLazyHeartRefill,
  getHeartRefillIntervalMs,
};
