const express = require("express");

const quizController = require("../controllers/quizController");
const { authenticateJwt } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/units/:unitId/attempts/start", authenticateJwt, quizController.startUnitAttempt);
router.post("/exercises/:exerciseId/attempts", authenticateJwt, quizController.submitExerciseAttempt);
router.post("/units/:unitId/complete", authenticateJwt, quizController.completeUnit);

module.exports = router;
