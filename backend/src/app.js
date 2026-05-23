const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const contentRoutes = require("./routes/contentRoutes");
const openapiSpec = require("./docs/openapi");
const examRoutes = require("./routes/examRoutes");
const historyRoutes = require("./routes/historyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const quizRoutes = require("./routes/quizRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

const extraOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

const allowedOrigins = new Set([
  "http://localhost:19006",
  "http://localhost:8081",
  "http://127.0.0.1:19006",
  "http://127.0.0.1:8081",
  ...extraOrigins,
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  }),
);
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", userRoutes);
app.use("/api", contentRoutes);
app.use("/api", quizRoutes);
app.use("/api", historyRoutes);
app.use("/api", notificationRoutes);
app.use("/api", examRoutes);
app.use("/api", subscriptionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
