const subscriptionService = require("../services/subscriptionService");

async function getSubscription(req, res, next) {
  try {
    const result = await subscriptionService.getSubscription(req.auth.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function createSubscription(req, res, next) {
  try {
    const result = await subscriptionService.createOrRenewSubscription(req.auth.userId, req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { createSubscription, getSubscription };
