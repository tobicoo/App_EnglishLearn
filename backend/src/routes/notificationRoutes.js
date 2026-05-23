const express = require("express");

const notificationController = require("../controllers/notificationController");
const { authenticateJwt } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateJwt);

router.get("/notifications", notificationController.list);
router.patch("/notifications/:id/read", notificationController.markRead);
router.post("/notifications/read-all", notificationController.markAllRead);

module.exports = router;
