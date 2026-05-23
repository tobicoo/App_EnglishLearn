const userService = require("../services/userService");

async function leaderboard(req, res, next) {
  try {
    const leaderboardData = await userService.getLeaderboard({ limit: req.query.limit });
    res.json({ leaderboard: leaderboardData });
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await userService.updateCurrentUserProfile(req.auth.userId, req.body || {});
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const user = await userService.changeCurrentUserPassword(req.auth.userId, req.body || {});
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  changePassword,
  leaderboard,
  updateMe,
};
