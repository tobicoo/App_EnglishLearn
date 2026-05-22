const express = require("express");

const adminController = require("../controllers/adminController");
const { authenticateJwt, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateJwt, requireAdmin);

router.get("/settings/heartbeat", adminController.getHeartbeatSetting);
router.patch("/settings/heartbeat", adminController.updateHeartbeatSetting);
router.get("/content", adminController.content);
router.patch("/sections/:id", adminController.updateSection);
router.patch("/units/:id", adminController.updateUnit);
router.patch("/exercises/:id", adminController.updateExercise);
router.get("/users", adminController.users);
router.patch("/users/:id/password", adminController.resetPassword);
router.post("/users/:id/progress/reset", adminController.resetProgress);

module.exports = router;
