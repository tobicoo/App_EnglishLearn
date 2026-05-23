const express = require("express");

const subscriptionController = require("../controllers/subscriptionController");
const { authenticateJwt } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateJwt);

router.get("/users/me/subscription", subscriptionController.getSubscription);
router.post("/subscriptions", subscriptionController.createSubscription);

module.exports = router;
