const { buildHeartMetadata } = require("../services/heartService");
const { getHeartRefillIntervalSecondsSync } = require("../services/settingsService");

function toSafeUserDto(user) {
  const heartMetadata = buildHeartMetadata(user);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    age: user.age,
    avatar: user.avatar,
    role: user.role,
    isAdmin: user.role === "ADMIN",
    level: user.level,
    xp: user.totalXp,
    totalXp: user.totalXp,
    streak: user.streak,
    gems: user.gems,
    hearts: heartMetadata.hearts,
    maxHearts: heartMetadata.maxHearts,
    heartRefilledAt: heartMetadata.heartRefilledAt,
    nextHeartAt: heartMetadata.nextHeartAt,
    secondsUntilNextHeart: heartMetadata.secondsUntilNextHeart,
    minutesUntilNextHeart: heartMetadata.minutesUntilNextHeart,
    heartRefillIntervalSeconds: getHeartRefillIntervalSecondsSync(),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toLeaderboardEntryDto(user, rank) {
  return {
    id: user.id,
    userId: user.id,
    rank,
    name: user.name,
    avatar: user.avatar,
    xp: user.totalXp,
    totalXp: user.totalXp,
    level: user.level,
  };
}

module.exports = {
  toLeaderboardEntryDto,
  toSafeUserDto,
};
