const express = require("express");

const historyController = require("../controllers/historyController");
const { authenticateJwt } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users/me/history/learning", authenticateJwt, historyController.learningHistory);
router.get("/users/me/history/created", authenticateJwt, historyController.createdHistory);

module.exports = router;
