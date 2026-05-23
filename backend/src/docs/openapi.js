const errorResponse = {
  type: "object",
  required: ["error"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string", example: "VALIDATION_ERROR" },
        message: { type: "string", example: "Request is invalid" },
      },
    },
  },
};

const idParam = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "integer", minimum: 1 },
});

const limitParam = {
  name: "limit",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1, default: 20 },
};

const offsetParam = {
  name: "offset",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 0, default: 0 },
};

const json = (schema) => ({
  content: {
    "application/json": { schema },
  },
});

const ok = (description, schema) => ({ description, ...json(schema) });
const created = (description, schema) => ({ description, ...json(schema) });

const errorRefs = (...codes) => Object.fromEntries(codes.map((code) => [code, { $ref: `#/components/responses/${code}` }]));

const authErrors = errorRefs("401");
const adminErrors = errorRefs("401", "403");
const mutationErrors = errorRefs("400", "401", "404");

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "English Learning API",
    version: "1.0.0",
    description: "REST API for authentication, learning content, quiz progress, exams, notifications, subscriptions, and admin management.",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    { url: "http://localhost:3001", description: "Alternate local development port" },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Users" },
    { name: "Content" },
    { name: "Quiz" },
    { name: "History" },
    { name: "Notifications" },
    { name: "Exams" },
    { name: "Subscriptions" },
    { name: "Admin" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    responses: {
      400: { description: "Bad request", ...json({ $ref: "#/components/schemas/ErrorResponse" }) },
      401: { description: "Missing, malformed, expired, or invalid bearer token", ...json({ $ref: "#/components/schemas/ErrorResponse" }) },
      403: { description: "Authenticated user is not allowed to perform this action", ...json({ $ref: "#/components/schemas/ErrorResponse" }) },
      404: { description: "Resource not found", ...json({ $ref: "#/components/schemas/ErrorResponse" }) },
      409: { description: "Conflict", ...json({ $ref: "#/components/schemas/ErrorResponse" }) },
      500: { description: "Internal server error", ...json({ $ref: "#/components/schemas/ErrorResponse" }) },
    },
    schemas: {
      ErrorResponse: errorResponse,
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          age: { type: "integer", nullable: true },
          avatar: { type: "string", nullable: true },
          role: { type: "string", enum: ["USER", "ADMIN"] },
          isAdmin: { type: "boolean" },
          level: { type: "integer" },
          xp: { type: "integer" },
          totalXp: { type: "integer" },
          streak: { type: "integer" },
          gems: { type: "integer" },
          hearts: { type: "integer" },
          maxHearts: { type: "integer" },
          heartRefilledAt: { type: "string", format: "date-time" },
          nextHeartAt: { type: "string", format: "date-time", nullable: true },
          secondsUntilNextHeart: { type: "integer" },
          minutesUntilNextHeart: { type: "integer" },
          heartRefillIntervalSeconds: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        required: ["token", "user"],
        properties: { token: { type: "string" }, user: { $ref: "#/components/schemas/User" } },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
          name: { type: "string" },
          age: { type: "integer", minimum: 0, maximum: 255, nullable: true },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
      },
      LeaderboardEntry: {
        type: "object",
        properties: {
          id: { type: "integer" },
          userId: { type: "integer" },
          rank: { type: "integer" },
          name: { type: "string" },
          avatar: { type: "string", nullable: true },
          xp: { type: "integer" },
          totalXp: { type: "integer" },
          level: { type: "integer" },
        },
      },
      ProfileUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 100 },
          age: { type: "integer", minimum: 0, maximum: 255, nullable: true },
          avatar: { type: "string", maxLength: 32, nullable: true },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 6 } },
      },
      Section: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          subtitle: { type: "string", nullable: true },
          subTitle: { type: "string", nullable: true },
          order: { type: "integer" },
          sortOrder: { type: "integer" },
          units: { type: "array", items: { $ref: "#/components/schemas/Unit" } },
        },
      },
      Unit: {
        type: "object",
        properties: {
          id: { type: "integer" },
          sectionId: { type: "integer" },
          title: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          kind: { type: "string", example: "lesson" },
          order: { type: "integer" },
          sortOrder: { type: "integer" },
          status: { type: "string", enum: ["done", "todo", "locked"] },
          type: { type: "string", enum: ["done", "todo", "locked"] },
          baseXp: { type: "integer" },
          xpAwarded: { type: "integer" },
          progress: { $ref: "#/components/schemas/UnitProgress" },
        },
      },
      UnitProgress: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "completed"] },
          completedExercises: { type: "integer" },
          totalExercises: { type: "integer" },
          bestScore: { type: "integer", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      ExerciseOption: {
        type: "object",
        properties: {
          id: { type: "integer" },
          text: { type: "string" },
          order: { type: "integer" },
          sortOrder: { type: "integer" },
          isCorrect: { type: "boolean" },
        },
      },
      MatchingPair: {
        type: "object",
        properties: {
          id: { type: "integer" },
          leftText: { type: "string" },
          rightText: { type: "string" },
          order: { type: "integer" },
          sortOrder: { type: "integer" },
        },
      },
      Exercise: {
        type: "object",
        properties: {
          id: { type: "integer" },
          unitId: { type: "integer" },
          type: { type: "string", enum: ["multiple_choice", "fill_blank", "matching", "MULTIPLE_CHOICE", "FILL_BLANK", "MATCHING"] },
          prompt: { type: "string" },
          instruction: { type: "string", nullable: true },
          explanation: { type: "string", nullable: true },
          answerText: { type: "string", nullable: true },
          correctOptionId: { type: "integer", nullable: true },
          order: { type: "integer" },
          sortOrder: { type: "integer" },
          xpReward: { type: "integer" },
          options: { type: "array", items: { $ref: "#/components/schemas/ExerciseOption" } },
          matchingPairs: { type: "array", items: { $ref: "#/components/schemas/MatchingPair" } },
          pairs: { type: "array", items: { $ref: "#/components/schemas/MatchingPair" } },
        },
      },
      Flashcard: {
        type: "object",
        properties: {
          id: { type: "integer" },
          unitId: { type: "integer" },
          word: { type: "string" },
          phonetic: { type: "string", nullable: true },
          meaning: { type: "string" },
          imageUrl: { type: "string", nullable: true },
          sortOrder: { type: "integer" },
        },
      },
      HeartMetadata: {
        type: "object",
        properties: {
          hearts: { type: "integer" },
          maxHearts: { type: "integer" },
          heartRefilledAt: { type: "string", format: "date-time" },
          nextHeartAt: { type: "string", format: "date-time", nullable: true },
          secondsUntilNextHeart: { type: "integer" },
          minutesUntilNextHeart: { type: "integer" },
          heartRefillIntervalSeconds: { type: "integer" },
        },
      },
      UnitAttempt: {
        type: "object",
        properties: {
          id: { type: "integer" },
          unitId: { type: "integer" },
          status: { type: "string" },
          startedAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true },
          totalExercises: { type: "integer" },
          correctAnswers: { type: "integer" },
          score: { type: "integer", nullable: true },
          xpEarned: { type: "integer" },
        },
      },
      ExerciseAttempt: {
        type: "object",
        properties: {
          id: { type: "integer" },
          unitAttemptId: { type: "integer" },
          unitId: { type: "integer" },
          exerciseId: { type: "integer" },
          response: { type: "object" },
          isCorrect: { type: "boolean" },
          heartsBefore: { type: "integer" },
          heartsAfter: { type: "integer" },
          xpEarned: { type: "integer" },
          attemptedAt: { type: "string", format: "date-time" },
        },
      },
      SubmitExerciseAttemptRequest: {
        oneOf: [
          { type: "object", required: ["unitAttemptId", "selectedOptionId"], properties: { unitAttemptId: { type: "integer" }, selectedOptionId: { type: "integer" } } },
          { type: "object", required: ["unitAttemptId", "answerText"], properties: { unitAttemptId: { type: "integer" }, answerText: { type: "string" } } },
          { type: "object", required: ["unitAttemptId", "pairs"], properties: { unitAttemptId: { type: "integer" }, pairs: { type: "array", items: { type: "object", required: ["leftText", "rightText"], properties: { leftText: { type: "string" }, rightText: { type: "string" } } } } } },
        ],
      },
      CompleteUnitRequest: { type: "object", required: ["unitAttemptId"], properties: { unitAttemptId: { type: "integer" } } },
      Exam: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          category: { type: "string", nullable: true, enum: ["Grammar", "Vocabulary", "Reading", "Listening", "Writing", "Speaking", "Mixed", null] },
          difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
          isPublic: { type: "boolean" },
          isPremium: { type: "boolean" },
          questionCount: { type: "integer" },
          creatorId: { type: "integer" },
          creatorName: { type: "string", nullable: true },
          bookmarkCount: { type: "integer" },
          isSaved: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ExamCreateRequest: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", maxLength: 255 },
          description: { type: "string", nullable: true },
          category: { type: "string", enum: ["Grammar", "Vocabulary", "Reading", "Listening", "Writing", "Speaking", "Mixed"] },
          difficulty: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] },
          isPublic: { type: "boolean" },
          isPremium: { type: "boolean" },
          accountType: { type: "string", enum: ["free", "premium"] },
        },
      },
      ExamQuestion: {
        type: "object",
        properties: {
          id: { type: "integer" },
          examId: { type: "integer" },
          questionText: { type: "string" },
          type: { type: "string", enum: ["MULTIPLE_CHOICE", "FILL_BLANK"] },
          options: { type: "array", nullable: true, items: { type: "object", properties: { text: { type: "string" }, isCorrect: { type: "boolean" } } } },
          correctAnswer: { type: "string", nullable: true },
          explanation: { type: "string", nullable: true },
          sortOrder: { type: "integer" },
        },
      },
      ExamQuestionCreateRequest: {
        type: "object",
        required: ["questionText"],
        properties: {
          questionText: { type: "string" },
          type: { type: "string", enum: ["MULTIPLE_CHOICE", "FILL_BLANK"] },
          options: { type: "array", items: { type: "object", required: ["text"], properties: { text: { type: "string" }, isCorrect: { type: "boolean" } } } },
          correctAnswer: { type: "string" },
          explanation: { type: "string", nullable: true },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "integer" },
          type: { type: "string", enum: ["system", "exam"] },
          icon: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          isRead: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Subscription: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "integer" },
          plan: { type: "string", enum: ["trial", "monthly", "yearly"] },
          status: { type: "string" },
          paymentMethod: { type: "string", nullable: true, enum: ["card", "paypal", "momo", "zalopay", null] },
          startedAt: { type: "string", format: "date-time" },
          expiresAt: { type: "string", format: "date-time" },
          isActive: { type: "boolean" },
          daysRemaining: { type: "integer" },
        },
      },
      SubscriptionCreateRequest: {
        type: "object",
        properties: {
          plan: { type: "string", enum: ["trial", "monthly", "yearly"], default: "monthly" },
          paymentMethod: { type: "string", enum: ["card", "paypal", "momo", "zalopay"] },
        },
      },
      AdminSectionRequest: {
        type: "object",
        properties: { title: { type: "string", maxLength: 120 }, subtitle: { type: "string", nullable: true }, subTitle: { type: "string", nullable: true }, sortOrder: { type: "integer", minimum: 1 }, isPublished: { type: "boolean" } },
      },
      AdminUnitRequest: {
        type: "object",
        properties: { sectionId: { type: "integer" }, title: { type: "string", nullable: true }, description: { type: "string", nullable: true }, kind: { type: "string", enum: ["LESSON", "REVIEW", "CHECKPOINT"] }, sortOrder: { type: "integer" }, xpReward: { type: "integer" }, isPublished: { type: "boolean" } },
      },
      AdminExerciseRequest: {
        type: "object",
        properties: { unitId: { type: "integer" }, type: { type: "string", enum: ["MULTIPLE_CHOICE", "FILL_BLANK", "MATCHING"] }, prompt: { type: "string" }, answerText: { type: "string", nullable: true }, correctOptionId: { type: "integer", nullable: true }, explanation: { type: "string", nullable: true }, sortOrder: { type: "integer" }, xpReward: { type: "integer" }, options: { type: "array", items: { $ref: "#/components/schemas/ExerciseOption" } }, matchingPairs: { type: "array", items: { $ref: "#/components/schemas/MatchingPair" } } },
      },
      AdminFlashcardRequest: {
        type: "object",
        properties: { unitId: { type: "integer" }, word: { type: "string" }, phonetic: { type: "string", nullable: true }, meaning: { type: "string" }, imageUrl: { type: "string", nullable: true }, sortOrder: { type: "integer" } },
      },
      AdminStats: {
        type: "object",
        properties: { totalUsers: { type: "integer" }, newUsersThisMonth: { type: "integer" }, totalCompletedAttempts: { type: "integer" }, avgScore: { type: "number" }, monthlyAttempts: { type: "array", items: { type: "integer" } }, activeSubscriptions: { type: "integer" }, revenueThisMonth: { type: "string" }, totalRevenue: { type: "string" }, revenueByType: { type: "array", items: { type: "object", properties: { label: { type: "string" }, pct: { type: "integer" }, color: { type: "string" } } } } },
      },
      ActivityLog: {
        type: "object",
        properties: { id: { type: "string" }, icon: { type: "string" }, action: { type: "string" }, detail: { type: "string" }, time: { type: "string", format: "date-time" }, type: { type: "string" } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {},
};

const withAuth = [{ bearerAuth: [] }];
const publicRoute = [];

function add(path, method, operation) {
  openapi.paths[path] = openapi.paths[path] || {};
  openapi.paths[path][method] = operation;
}

function op({ tags, summary, security = withAuth, parameters, requestBody, responses }) {
  return { tags, summary, security, ...(parameters ? { parameters } : {}), ...(requestBody ? { requestBody } : {}), responses };
}

add("/health", "get", op({ tags: ["Health"], summary: "Health check", security: publicRoute, responses: { 200: ok("API is healthy", { type: "object", properties: { ok: { type: "boolean", example: true } } }) } }));
add("/api/auth/register", "post", op({ tags: ["Auth"], summary: "Register a user", security: publicRoute, requestBody: json({ $ref: "#/components/schemas/RegisterRequest" }), responses: { 201: created("Created user and JWT", { $ref: "#/components/schemas/AuthResponse" }), ...errorRefs("400", "409", "500") } }));
add("/api/auth/login", "post", op({ tags: ["Auth"], summary: "Login", security: publicRoute, requestBody: json({ $ref: "#/components/schemas/LoginRequest" }), responses: { 200: ok("JWT and user profile", { $ref: "#/components/schemas/AuthResponse" }), ...errorRefs("400", "401", "500") } }));
add("/api/auth/me", "get", op({ tags: ["Auth"], summary: "Get current user", responses: { 200: ok("Current user", { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } }), ...authErrors } }));

add("/api/leaderboard", "get", op({ tags: ["Users"], summary: "Get leaderboard", security: publicRoute, parameters: [limitParam], responses: { 200: ok("Leaderboard entries", { type: "object", properties: { leaderboard: { type: "array", items: { $ref: "#/components/schemas/LeaderboardEntry" } } } }), ...errorRefs("500") } }));
add("/api/users/me", "patch", op({ tags: ["Users"], summary: "Update current user profile", requestBody: json({ $ref: "#/components/schemas/ProfileUpdateRequest" }), responses: { 200: ok("Updated user", { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } }), ...errorRefs("400", "401") } }));
add("/api/users/me/password", "patch", op({ tags: ["Users"], summary: "Change current user password", requestBody: json({ $ref: "#/components/schemas/ChangePasswordRequest" }), responses: { 200: ok("Updated user", { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } }), ...errorRefs("400", "401") } }));

add("/api/sections", "get", op({ tags: ["Content"], summary: "Get published sections with user progress", responses: { 200: ok("Sections", { type: "object", properties: { sections: { type: "array", items: { $ref: "#/components/schemas/Section" } } } }), ...authErrors } }));
add("/api/units/{unitId}", "get", op({ tags: ["Content"], summary: "Get a unit with progress", parameters: [idParam("unitId", "Unit ID")], responses: { 200: ok("Unit", { type: "object", properties: { unit: { $ref: "#/components/schemas/Unit" } } }), ...errorRefs("401", "404") } }));
add("/api/units/{unitId}/exercises", "get", op({ tags: ["Content"], summary: "Get exercises for a unit", parameters: [idParam("unitId", "Unit ID")], responses: { 200: ok("Exercises", { type: "object", properties: { exercises: { type: "array", items: { $ref: "#/components/schemas/Exercise" } } } }), ...errorRefs("401", "404") } }));
add("/api/flashcards", "get", op({ tags: ["Content"], summary: "Get flashcards", security: publicRoute, parameters: [{ name: "unitId", in: "query", required: false, schema: { type: "integer", minimum: 1 } }], responses: { 200: ok("Flashcards", { type: "object", properties: { flashcards: { type: "array", items: { $ref: "#/components/schemas/Flashcard" } } } }), ...errorRefs("500") } }));

add("/api/units/{unitId}/attempts/start", "post", op({ tags: ["Quiz"], summary: "Start a unit attempt", parameters: [idParam("unitId", "Unit ID")], responses: { 201: created("Started unit attempt", { allOf: [{ $ref: "#/components/schemas/HeartMetadata" }, { type: "object", properties: { unitAttempt: { $ref: "#/components/schemas/UnitAttempt" }, unitAttemptId: { type: "integer" } } }] }), ...mutationErrors } }));
add("/api/exercises/{exerciseId}/attempts", "post", op({ tags: ["Quiz"], summary: "Submit an exercise answer", parameters: [idParam("exerciseId", "Exercise ID")], requestBody: json({ $ref: "#/components/schemas/SubmitExerciseAttemptRequest" }), responses: { 200: ok("Attempt result", { allOf: [{ $ref: "#/components/schemas/HeartMetadata" }, { type: "object", properties: { isCorrect: { type: "boolean" }, correctAnswer: { nullable: true }, attempt: { $ref: "#/components/schemas/ExerciseAttempt" } } }] }), ...mutationErrors } }));
add("/api/units/{unitId}/complete", "post", op({ tags: ["Quiz"], summary: "Complete a unit attempt", parameters: [idParam("unitId", "Unit ID")], requestBody: json({ $ref: "#/components/schemas/CompleteUnitRequest" }), responses: { 200: ok("Completion result", { allOf: [{ $ref: "#/components/schemas/HeartMetadata" }, { type: "object", properties: { completed: { type: "boolean" }, xpAwarded: { type: "integer" }, gemsAwarded: { type: "integer" }, streakIncremented: { type: "boolean" }, totalXp: { type: "integer" }, previousLevel: { type: "integer" }, level: { type: "integer" }, leveledUp: { type: "boolean" }, gems: { type: "integer" }, streak: { type: "integer" }, unitAttempt: { $ref: "#/components/schemas/UnitAttempt" }, progress: { $ref: "#/components/schemas/UnitProgress" } } }] }), ...mutationErrors } }));

add("/api/users/me/history/learning", "get", op({ tags: ["History"], summary: "Get completed lesson history", parameters: [limitParam, offsetParam], responses: { 200: ok("Learning history", { type: "object", properties: { history: { type: "array", items: { type: "object" } }, total: { type: "integer" } } }), ...authErrors } }));
add("/api/users/me/history/created", "get", op({ tags: ["History"], summary: "Get created exam history", parameters: [limitParam, offsetParam], responses: { 200: ok("Created exam history", { type: "object", properties: { history: { type: "array", items: { type: "object" } }, total: { type: "integer" } } }), ...authErrors } }));

add("/api/notifications", "get", op({ tags: ["Notifications"], summary: "List notifications", parameters: [{ name: "type", in: "query", schema: { type: "string", enum: ["system", "exam"] } }], responses: { 200: ok("Notifications", { type: "object", properties: { notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } }, unreadCount: { type: "integer" } } }), ...authErrors } }));
add("/api/notifications/{id}/read", "patch", op({ tags: ["Notifications"], summary: "Mark a notification as read", parameters: [idParam("id", "Notification ID")], responses: { 200: ok("Updated notification", { type: "object", properties: { notification: { $ref: "#/components/schemas/Notification" } } }), ...errorRefs("401", "404") } }));
add("/api/notifications/read-all", "post", op({ tags: ["Notifications"], summary: "Mark all notifications as read", responses: { 200: ok("Update count", { type: "object", properties: { updated: { type: "integer" } } }), ...authErrors } }));

add("/api/exams", "get", op({ tags: ["Exams"], summary: "List public exams", security: publicRoute, parameters: [limitParam, offsetParam, { name: "category", in: "query", schema: { type: "string" } }, { name: "difficulty", in: "query", schema: { type: "string", enum: ["EASY", "MEDIUM", "HARD"] } }, { name: "search", in: "query", schema: { type: "string" } }], responses: { 200: ok("Exams", { type: "object", properties: { exams: { type: "array", items: { $ref: "#/components/schemas/Exam" } }, total: { type: "integer" } } }), ...errorRefs("500") } }));
add("/api/exams", "post", op({ tags: ["Exams"], summary: "Create an exam", requestBody: json({ $ref: "#/components/schemas/ExamCreateRequest" }), responses: { 201: created("Created exam", { type: "object", properties: { exam: { $ref: "#/components/schemas/Exam" } } }), ...errorRefs("400", "401") } }));
add("/api/exams/my", "get", op({ tags: ["Exams"], summary: "List exams created by current user", parameters: [limitParam, offsetParam], responses: { 200: ok("My exams", { type: "object", properties: { exams: { type: "array", items: { $ref: "#/components/schemas/Exam" } }, total: { type: "integer" } } }), ...authErrors } }));
add("/api/exams/saved", "get", op({ tags: ["Exams"], summary: "List saved exams", parameters: [limitParam, offsetParam], responses: { 200: ok("Saved exams", { type: "object", properties: { exams: { type: "array", items: { $ref: "#/components/schemas/Exam" } }, total: { type: "integer" } } }), ...authErrors } }));
add("/api/exams/{id}/bookmark", "post", op({ tags: ["Exams"], summary: "Toggle exam bookmark", parameters: [idParam("id", "Exam ID")], responses: { 200: ok("Bookmark state", { type: "object", properties: { saved: { type: "boolean" }, examId: { type: "integer" } } }), ...errorRefs("401", "404") } }));
add("/api/exams/{id}/bookmark", "delete", op({ tags: ["Exams"], summary: "Remove exam bookmark", parameters: [idParam("id", "Exam ID")], responses: { 200: ok("Bookmark removed", { type: "object", properties: { saved: { type: "boolean" }, examId: { type: "integer" } } }), ...errorRefs("401", "404") } }));
add("/api/exams/{id}/questions", "get", op({ tags: ["Exams"], summary: "Get exam questions", security: publicRoute, parameters: [idParam("id", "Exam ID")], responses: { 200: ok("Exam questions", { type: "object", properties: { exam: { $ref: "#/components/schemas/Exam" }, questions: { type: "array", items: { $ref: "#/components/schemas/ExamQuestion" } } } }), ...errorRefs("403", "404") } }));
add("/api/exams/{id}/questions", "post", op({ tags: ["Exams"], summary: "Add an exam question", parameters: [idParam("id", "Exam ID")], requestBody: json({ $ref: "#/components/schemas/ExamQuestionCreateRequest" }), responses: { 201: created("Created question", { type: "object", properties: { question: { $ref: "#/components/schemas/ExamQuestion" } } }), ...errorRefs("400", "401", "403", "404") } }));
add("/api/exams/{id}/questions/{questionId}", "delete", op({ tags: ["Exams"], summary: "Delete an exam question", parameters: [idParam("id", "Exam ID"), idParam("questionId", "Question ID")], responses: { 200: ok("Deleted question", { type: "object", properties: { deleted: { type: "boolean" }, questionId: { type: "integer" } } }), ...errorRefs("401", "403", "404") } }));

add("/api/users/me/subscription", "get", op({ tags: ["Subscriptions"], summary: "Get current subscription", responses: { 200: ok("Subscription", { type: "object", properties: { subscription: { $ref: "#/components/schemas/Subscription" } } }), ...authErrors } }));
add("/api/subscriptions", "post", op({ tags: ["Subscriptions"], summary: "Create or renew a subscription", requestBody: json({ $ref: "#/components/schemas/SubscriptionCreateRequest" }), responses: { 201: created("Subscription", { type: "object", properties: { subscription: { $ref: "#/components/schemas/Subscription" } } }), ...errorRefs("400", "401") } }));

add("/api/admin/settings/heartbeat", "get", op({ tags: ["Admin"], summary: "Get heartbeat setting", responses: { 200: ok("Heartbeat setting", { type: "object", properties: { heartRefillIntervalSeconds: { type: "integer" } } }), ...adminErrors } }));
add("/api/admin/settings/heartbeat", "patch", op({ tags: ["Admin"], summary: "Update heartbeat setting", requestBody: json({ type: "object", properties: { heartRefillIntervalSeconds: { type: "integer", minimum: 1, maximum: 86400 }, seconds: { type: "integer", minimum: 1, maximum: 86400 } } }), responses: { 200: ok("Heartbeat setting", { type: "object", properties: { heartRefillIntervalSeconds: { type: "integer" } } }), ...errorRefs("400", "401", "403") } }));
add("/api/admin/content", "get", op({ tags: ["Admin"], summary: "Get all admin content", responses: { 200: ok("Sections with nested units, flashcards, and exercises", { type: "object", properties: { sections: { type: "array", items: { $ref: "#/components/schemas/Section" } } } }), ...adminErrors } }));

for (const [resource, schema, requestSchema] of [
  ["sections", "Section", "AdminSectionRequest"],
  ["units", "Unit", "AdminUnitRequest"],
  ["exercises", "Exercise", "AdminExerciseRequest"],
  ["flashcards", "Flashcard", "AdminFlashcardRequest"],
]) {
  const singular = resource.slice(0, -1);
  add(`/api/admin/${resource}`, "post", op({ tags: ["Admin"], summary: `Create ${singular}`, requestBody: json({ $ref: `#/components/schemas/${requestSchema}` }), responses: { 200: ok(`Created ${singular}`, { type: "object", properties: { [singular]: { $ref: `#/components/schemas/${schema}` } } }), ...errorRefs("400", "401", "403") } }));
  add(`/api/admin/${resource}/{id}`, "patch", op({ tags: ["Admin"], summary: `Update ${singular}`, parameters: [idParam("id", `${singular} ID`)], requestBody: json({ $ref: `#/components/schemas/${requestSchema}` }), responses: { 200: ok(`Updated ${singular}`, { type: "object", properties: { [singular]: { $ref: `#/components/schemas/${schema}` } } }), ...errorRefs("400", "401", "403", "404") } }));
  add(`/api/admin/${resource}/{id}`, "delete", op({ tags: ["Admin"], summary: `Delete ${singular}`, parameters: [idParam("id", `${singular} ID`)], responses: { 200: ok(`Deleted ${singular}`, { type: "object", properties: { deleted: { type: "boolean" } } }), ...errorRefs("401", "403", "404") } }));
}

add("/api/admin/users", "get", op({ tags: ["Admin"], summary: "List users", responses: { 200: ok("Users", { type: "object", properties: { users: { type: "array", items: { $ref: "#/components/schemas/User" } } } }), ...adminErrors } }));
add("/api/admin/users/{id}/password", "patch", op({ tags: ["Admin"], summary: "Reset a user password", parameters: [idParam("id", "User ID")], requestBody: json({ type: "object", properties: { newPassword: { type: "string", minLength: 6 }, password: { type: "string", minLength: 6 } } }), responses: { 200: ok("Updated user", { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } }), ...errorRefs("400", "401", "403", "404") } }));
add("/api/admin/users/{id}/progress/reset", "post", op({ tags: ["Admin"], summary: "Reset a user's learning progress", parameters: [idParam("id", "User ID")], responses: { 200: ok("Reset user", { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } }), ...errorRefs("401", "403", "404") } }));
add("/api/admin/stats", "get", op({ tags: ["Admin"], summary: "Get admin statistics", responses: { 200: ok("Stats", { $ref: "#/components/schemas/AdminStats" }), ...adminErrors } }));
add("/api/admin/activity-log", "get", op({ tags: ["Admin"], summary: "Get recent activity log", parameters: [limitParam], responses: { 200: ok("Activity log", { type: "object", properties: { logs: { type: "array", items: { $ref: "#/components/schemas/ActivityLog" } } } }), ...adminErrors } }));

module.exports = openapi;
