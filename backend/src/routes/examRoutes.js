const express = require("express");

const examController = require("../controllers/examController");
const { authenticateJwt } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/exams", examController.listExams);
router.post("/exams", authenticateJwt, examController.createExam);
router.get("/exams/my", authenticateJwt, examController.myExams);
router.get("/exams/saved", authenticateJwt, examController.savedExams);
router.post("/exams/:id/bookmark", authenticateJwt, examController.toggleBookmark);
router.delete("/exams/:id/bookmark", authenticateJwt, examController.removeBookmark);
router.get("/exams/:id/questions", examController.getQuestions);
router.post("/exams/:id/questions", authenticateJwt, examController.addQuestion);
router.delete("/exams/:id/questions/:questionId", authenticateJwt, examController.deleteQuestion);

module.exports = router;
