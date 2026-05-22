const express = require("express");
const cors = require("cors");

const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const contentRoutes = require("./routes/contentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

const localExpoOrigins = [
  "http://localhost:19006",
  "http://localhost:8081",
  "http://127.0.0.1:19006",
  "http://127.0.0.1:8081",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || localExpoOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }),
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", userRoutes);
app.use("/api", contentRoutes);
app.use("/api", quizRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
