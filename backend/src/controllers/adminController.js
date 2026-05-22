const adminService = require("../services/adminService");

async function getHeartbeatSetting(req, res, next) {
  try {
    res.json(await adminService.getHeartbeatSetting());
  } catch (error) {
    next(error);
  }
}

async function updateHeartbeatSetting(req, res, next) {
  try {
    res.json(await adminService.updateHeartbeatSetting(req.body || {}));
  } catch (error) {
    next(error);
  }
}

async function content(req, res, next) {
  try {
    res.json({ sections: await adminService.getContent() });
  } catch (error) {
    next(error);
  }
}

async function updateSection(req, res, next) {
  try {
    res.json({ section: await adminService.updateSection(req.params.id, req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function updateUnit(req, res, next) {
  try {
    res.json({ unit: await adminService.updateUnit(req.params.id, req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function updateExercise(req, res, next) {
  try {
    res.json({ exercise: await adminService.updateExercise(req.params.id, req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function users(req, res, next) {
  try {
    res.json({ users: await adminService.getUsers() });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    res.json({ user: await adminService.resetUserPassword(req.params.id, req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function resetProgress(req, res, next) {
  try {
    res.json({ user: await adminService.resetUserProgress(req.params.id) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  content,
  getHeartbeatSetting,
  resetPassword,
  resetProgress,
  updateExercise,
  updateHeartbeatSetting,
  updateSection,
  updateUnit,
  users,
};
