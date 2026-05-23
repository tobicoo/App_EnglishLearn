const historyService = require("../services/historyService");

async function learningHistory(req, res, next) {
  try {
    const result = await historyService.getLearningHistory(req.auth.userId, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function createdHistory(req, res, next) {
  try {
    const result = await historyService.getCreatedHistory(req.auth.userId, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { createdHistory, learningHistory };
