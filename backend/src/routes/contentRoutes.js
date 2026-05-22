const express = require("express");

const contentController = require("../controllers/contentController");
const { authenticateJwt } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/sections", authenticateJwt, contentController.sections);
router.get("/units/:unitId", authenticateJwt, contentController.unit);
router.get("/units/:unitId/exercises", authenticateJwt, contentController.unitExercises);
router.get("/flashcards", contentController.flashcards);

module.exports = router;
