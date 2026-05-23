const openapi = require("../src/docs/openapi");

const expected = [
  ["get", "/health"],
  ["post", "/api/auth/register"],
  ["post", "/api/auth/login"],
  ["get", "/api/auth/me"],
  ["get", "/api/leaderboard"],
  ["patch", "/api/users/me"],
  ["patch", "/api/users/me/password"],
  ["get", "/api/sections"],
  ["get", "/api/units/{unitId}"],
  ["get", "/api/units/{unitId}/exercises"],
  ["get", "/api/flashcards"],
  ["post", "/api/units/{unitId}/attempts/start"],
  ["post", "/api/exercises/{exerciseId}/attempts"],
  ["post", "/api/units/{unitId}/complete"],
  ["get", "/api/users/me/history/learning"],
  ["get", "/api/users/me/history/created"],
  ["get", "/api/notifications"],
  ["patch", "/api/notifications/{id}/read"],
  ["post", "/api/notifications/read-all"],
  ["get", "/api/exams"],
  ["post", "/api/exams"],
  ["get", "/api/exams/my"],
  ["get", "/api/exams/saved"],
  ["post", "/api/exams/{id}/bookmark"],
  ["delete", "/api/exams/{id}/bookmark"],
  ["get", "/api/exams/{id}/questions"],
  ["post", "/api/exams/{id}/questions"],
  ["delete", "/api/exams/{id}/questions/{questionId}"],
  ["get", "/api/users/me/subscription"],
  ["post", "/api/subscriptions"],
  ["get", "/api/admin/settings/heartbeat"],
  ["patch", "/api/admin/settings/heartbeat"],
  ["get", "/api/admin/content"],
  ["post", "/api/admin/sections"],
  ["patch", "/api/admin/sections/{id}"],
  ["delete", "/api/admin/sections/{id}"],
  ["post", "/api/admin/units"],
  ["patch", "/api/admin/units/{id}"],
  ["delete", "/api/admin/units/{id}"],
  ["post", "/api/admin/exercises"],
  ["patch", "/api/admin/exercises/{id}"],
  ["delete", "/api/admin/exercises/{id}"],
  ["post", "/api/admin/flashcards"],
  ["patch", "/api/admin/flashcards/{id}"],
  ["delete", "/api/admin/flashcards/{id}"],
  ["get", "/api/admin/users"],
  ["patch", "/api/admin/users/{id}/password"],
  ["post", "/api/admin/users/{id}/progress/reset"],
  ["get", "/api/admin/stats"],
  ["get", "/api/admin/activity-log"],
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!openapi.openapi || !openapi.info || !openapi.paths) {
  fail("OpenAPI spec is missing required top-level fields");
}

if (openapi.components?.securitySchemes?.bearerAuth?.scheme !== "bearer") {
  fail("OpenAPI spec is missing bearerAuth security scheme");
}

for (const [method, path] of expected) {
  if (!openapi.paths[path]?.[method]) {
    fail(`Missing OpenAPI operation: ${method.toUpperCase()} ${path}`);
  }
}

const publicRoutes = new Set([
  "GET /health",
  "POST /api/auth/register",
  "POST /api/auth/login",
  "GET /api/leaderboard",
  "GET /api/flashcards",
  "GET /api/exams",
  "GET /api/exams/{id}/questions",
]);

for (const [path, pathItem] of Object.entries(openapi.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    const key = `${method.toUpperCase()} ${path}`;
    if (publicRoutes.has(key)) continue;
    const hasBearer = operation.security?.some((entry) => Object.prototype.hasOwnProperty.call(entry, "bearerAuth"));
    if (!hasBearer) {
      fail(`Protected operation is missing bearer auth: ${key}`);
    }
  }
}

if (!process.exitCode) {
  console.log(`OpenAPI verification passed for ${expected.length} operations.`);
}
