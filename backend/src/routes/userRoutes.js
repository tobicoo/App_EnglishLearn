const express = require("express");

const userController = require("../controllers/userController");
const { authenticateJwt } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/leaderboard", userController.leaderboard);
router.patch("/users/me", authenticateJwt, userController.updateMe);
router.patch("/users/me/password", authenticateJwt, userController.changePassword);

module.exports = router;
