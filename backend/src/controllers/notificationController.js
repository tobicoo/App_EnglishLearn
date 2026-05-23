const notificationService = require("../services/notificationService");

async function list(req, res, next) {
  try {
    const result = await notificationService.listNotifications(req.auth.userId, {
      type: req.query.type,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markRead(req.auth.userId, req.params.id);
    res.json({ notification });
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllRead(req.auth.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { list, markAllRead, markRead };
