const adminService = require("../services/adminService");

async function createSection(req, res, next) {
  try {
    res.json({ section: await adminService.createSection(req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function createUnit(req, res, next) {
  try {
    res.json({ unit: await adminService.createUnit(req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function createFlashcard(req, res, next) {
  try {
    res.json({ flashcard: await adminService.createFlashcard(req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function updateFlashcard(req, res, next) {
  try {
    res.json({ flashcard: await adminService.updateFlashcard(req.params.id, req.body || {}) });
  } catch (error) {
    next(error);
  }
}

async function deleteFlashcard(req, res, next) {
  try {
    await adminService.deleteFlashcard(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
}

async function createExercise(req, res, next) {
  try {
    res.json({ exercise: await adminService.createExercise(req.body || {}) });
  } catch (error) {
    next(error);
  }
}

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

async function deleteSection(req, res, next) {
  try {
    await adminService.deleteSection(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
}

async function deleteUnit(req, res, next) {
  try {
    await adminService.deleteUnit(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
}

async function deleteExercise(req, res, next) {
  try {
    await adminService.deleteExercise(req.params.id);
    res.json({ deleted: true });
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

async function stats(req, res, next) {
  try {
    res.json(await adminService.getStats());
  } catch (error) {
    next(error);
  }
}

async function activityLog(req, res, next) {
  try {
    const logs = await adminService.getActivityLog({ limit: req.query.limit });
    res.json({ logs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  activityLog,
  content,
  stats,
  createExercise,
  createFlashcard,
  createSection,
  createUnit,
  deleteExercise,
  deleteFlashcard,
  deleteSection,
  deleteUnit,
  getHeartbeatSetting,
  resetPassword,
  resetProgress,
  updateExercise,
  updateFlashcard,
  updateHeartbeatSetting,
  updateSection,
  updateUnit,
  users,
};
