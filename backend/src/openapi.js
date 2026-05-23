const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "English Learning API",
    version: "1.0.0",
    description:
      "Practical OpenAPI document for the current Express backend. Schemas stay concise for Swagger UI testing while matching the routes mounted in src/app.js.",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "Health", description: "Health and runtime checks" },
    { name: "Auth", description: "Authentication and current-user auth state" },
    { name: "Users", description: "User profile and leaderboard" },
    { name: "Content", description: "Published sections, units, exercises, and flashcards" },
    { name: "Quiz", description: "Unit attempts, exercise submissions, and completion" },
    { name: "Admin", description: "Admin-only content, settings, and user management" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    parameters: {
      unitId: {
        name: "unitId",
        in: "path",
        required: true,
        description: "Positive numeric unit ID.",
        schema: { type: "integer", minimum: 1, example: 1 },
      },
      exerciseId: {
        name: "exerciseId",
        in: "path",
        required: true,
        description: "Positive numeric exercise ID.",
        schema: { type: "integer", minimum: 1, example: 101 },
      },
      id: {
        name: "id",
        in: "path",
        required: true,
        description: "Positive numeric resource ID.",
        schema: { type: "integer", minimum: 1, example: 1 },
      },
      userId: {
        name: "id",
        in: "path",
        required: true,
        description: "Positive numeric user ID.",
        schema: { type: "integer", minimum: 1, example: 7 },
      },
      flashcardsUnitId: {
        name: "unitId",
        in: "query",
        required: false,
        description: "Optional positive numeric unit ID filter. Invalid values currently return an empty list instead of an error.",
        schema: { type: "integer", minimum: 1, example: 1 },
      },
    },
    responses: {
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            examples: {
              validation: {
                value: {
                  error: {
                    code: "VALIDATION_ERROR",
                    message: "At least one field is required",
                  },
                },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: "Missing, malformed, invalid, or expired bearer token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            examples: {
              missingToken: {
                value: {
                  error: {
                    code: "MISSING_TOKEN",
                    message: "Bearer token is required",
                  },
                },
              },
              malformedToken: {
                value: {
                  error: {
                    code: "MALFORMED_TOKEN",
                    message: "Token is invalid or expired",
                  },
                },
              },
            },
          },
        },
      },
      ForbiddenAdmin: {
        description: "Authenticated user is not an admin",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: {
                code: "ADMIN_REQUIRED",
                message: "Admin access is required",
              },
            },
          },
        },
      },
      NotFound: {
        description: "Requested route or resource was not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: {
                code: "NOT_FOUND",
                message: "Route GET /missing not found",
              },
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Internal server error",
              },
            },
          },
        },
      },
    },
    schemas: {
      ErrorBody: {
        type: "object",
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Request failed" },
        },
        required: ["code", "message"],
        additionalProperties: false,
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { $ref: "#/components/schemas/ErrorBody" },
        },
        required: ["error"],
        additionalProperties: false,
      },
      HealthResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
        },
        required: ["ok"],
        additionalProperties: false,
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          email: { type: "string", format: "email", example: "learner@example.com" },
          name: { type: "string", example: "Learner" },
          age: { type: "integer", nullable: true, example: 20 },
          avatar: { type: "string", nullable: true, example: "fox" },
          role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
          isAdmin: { type: "boolean", example: false },
          level: { type: "integer", example: 3 },
          xp: { type: "integer", example: 420 },
          totalXp: { type: "integer", example: 420 },
          streak: { type: "integer", example: 5 },
          gems: { type: "integer", example: 18 },
          hearts: { type: "integer", example: 4 },
          maxHearts: { type: "integer", example: 5 },
          heartRefilledAt: { type: "string", format: "date-time", nullable: true },
          nextHeartAt: { type: "string", format: "date-time", nullable: true },
          secondsUntilNextHeart: { type: "integer", example: 90 },
          minutesUntilNextHeart: { type: "integer", example: 2 },
          heartRefillIntervalSeconds: { type: "integer", example: 120 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id",
          "email",
          "name",
          "role",
          "isAdmin",
          "level",
          "xp",
          "totalXp",
          "streak",
          "gems",
          "hearts",
          "maxHearts",
          "secondsUntilNextHeart",
          "minutesUntilNextHeart",
          "heartRefillIntervalSeconds",
          "createdAt",
          "updatedAt",
        ],
      },
      AuthSuccess: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: { $ref: "#/components/schemas/User" },
        },
        required: ["token", "user"],
      },
      CurrentUserResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
        },
        required: ["user"],
      },
      LeaderboardEntry: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          userId: { type: "integer", example: 1 },
          rank: { type: "integer", example: 1 },
          name: { type: "string", example: "Top Learner" },
          avatar: { type: "string", nullable: true, example: "owl" },
          xp: { type: "integer", example: 1200 },
          totalXp: { type: "integer", example: 1200 },
          level: { type: "integer", example: 7 },
        },
        required: ["id", "userId", "rank", "name", "xp", "totalXp", "level"],
      },
      LeaderboardResponse: {
        type: "object",
        properties: {
          leaderboard: {
            type: "array",
            items: { $ref: "#/components/schemas/LeaderboardEntry" },
          },
        },
        required: ["leaderboard"],
      },
      UnitProgress: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"], example: "IN_PROGRESS" },
          completedExercises: { type: "integer", example: 2 },
          totalExercises: { type: "integer", example: 5 },
          bestScore: { type: "integer", nullable: true, example: 80 },
          completedAt: { type: "string", format: "date-time", nullable: true },
        },
        required: ["status", "completedExercises", "totalExercises"],
      },
      UnitSummary: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          sectionId: { type: "integer", example: 1 },
          title: { type: "string", nullable: true, example: "Greetings" },
          description: { type: "string", nullable: true, example: "Basic greeting phrases" },
          kind: { type: "string", example: "lesson" },
          order: { type: "integer", example: 1 },
          sortOrder: { type: "integer", example: 1 },
          status: { type: "string", enum: ["todo", "done", "locked"], example: "todo" },
          type: { type: "string", enum: ["todo", "done", "locked"], example: "todo" },
          baseXp: { type: "integer", example: 20 },
          xpAwarded: { type: "integer", example: 0 },
          progress: { $ref: "#/components/schemas/UnitProgress" },
        },
        required: [
          "id",
          "sectionId",
          "kind",
          "order",
          "sortOrder",
          "status",
          "type",
          "baseXp",
          "xpAwarded",
          "progress",
        ],
      },
      Section: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Foundations" },
          subTitle: { type: "string", nullable: true, example: "Start here" },
          subtitle: { type: "string", nullable: true, example: "Start here" },
          order: { type: "integer", example: 1 },
          sortOrder: { type: "integer", example: 1 },
          units: {
            type: "array",
            items: { $ref: "#/components/schemas/UnitSummary" },
          },
        },
        required: ["id", "title", "order", "sortOrder", "units"],
      },
      SectionsResponse: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: { $ref: "#/components/schemas/Section" },
          },
        },
        required: ["sections"],
      },
      UnitResponse: {
        type: "object",
        properties: {
          unit: { $ref: "#/components/schemas/UnitSummary" },
        },
        required: ["unit"],
      },
      ExerciseOption: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1001 },
          text: { type: "string", example: "Hello" },
          order: { type: "integer", example: 1 },
        },
        required: ["id", "text", "order"],
      },
      MatchingPair: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2001 },
          leftText: { type: "string", example: "hello" },
          rightText: { type: "string", example: "xin chào" },
          order: { type: "integer", example: 1 },
        },
        required: ["id", "leftText", "rightText", "order"],
      },
      Exercise: {
        type: "object",
        properties: {
          id: { type: "integer", example: 101 },
          unitId: { type: "integer", example: 1 },
          type: { type: "string", enum: ["multiple_choice", "fill_blank", "matching"], example: "multiple_choice" },
          prompt: { type: "string", example: "Choose the correct greeting" },
          instruction: { type: "string", nullable: true, example: "Pick the best answer" },
          order: { type: "integer", example: 1 },
          options: {
            type: "array",
            items: { $ref: "#/components/schemas/ExerciseOption" },
          },
          pairs: {
            type: "array",
            items: { $ref: "#/components/schemas/MatchingPair" },
          },
        },
        required: ["id", "unitId", "type", "prompt", "order"],
      },
      UnitExercisesResponse: {
        type: "object",
        properties: {
          exercises: {
            type: "array",
            items: { $ref: "#/components/schemas/Exercise" },
          },
        },
        required: ["exercises"],
      },
      Flashcard: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          unitId: { type: "integer", example: 1 },
          word: { type: "string", example: "hello" },
          phonetic: { type: "string", nullable: true, example: "/həˈləʊ/" },
          meaning: { type: "string", example: "xin chào" },
          imageUrl: { type: "string", nullable: true, example: "https://example.com/hello.png" },
          sortOrder: { type: "integer", example: 1 },
        },
        required: ["id", "unitId", "word", "meaning", "sortOrder"],
      },
      FlashcardsResponse: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: { $ref: "#/components/schemas/Flashcard" },
          },
        },
        required: ["flashcards"],
      },
      UnitAttempt: {
        type: "object",
        properties: {
          id: { type: "integer", example: 12 },
          unitId: { type: "integer", example: 1 },
          status: { type: "string", enum: ["in_progress", "completed"], example: "in_progress" },
          startedAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true },
          totalExercises: { type: "integer", example: 5 },
          correctAnswers: { type: "integer", example: 4 },
          score: { type: "integer", example: 80 },
          xpEarned: { type: "integer", example: 28 },
        },
        required: ["id", "unitId", "status", "startedAt", "totalExercises", "correctAnswers", "score", "xpEarned"],
      },
      StartUnitAttemptResponse: {
        type: "object",
        properties: {
          unitAttempt: { $ref: "#/components/schemas/UnitAttempt" },
          unitAttemptId: { type: "integer", example: 12 },
        },
        required: ["unitAttempt", "unitAttemptId"],
      },
      ExerciseAttempt: {
        type: "object",
        properties: {
          id: { type: "integer", example: 901 },
          unitAttemptId: { type: "integer", nullable: true, example: 12 },
          unitId: { type: "integer", example: 1 },
          exerciseId: { type: "integer", example: 101 },
          response: {
            type: "object",
            description: "Stored response payload varies by exercise type.",
            additionalProperties: true,
          },
          isCorrect: { type: "boolean", example: true },
          heartsBefore: { type: "integer", example: 5 },
          heartsAfter: { type: "integer", example: 5 },
          xpEarned: { type: "integer", example: 0 },
          attemptedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "unitId", "exerciseId", "isCorrect", "heartsBefore", "heartsAfter", "xpEarned", "attemptedAt"],
      },
      HeartState: {
        type: "object",
        properties: {
          hearts: { type: "integer", example: 4 },
          maxHearts: { type: "integer", example: 5 },
          heartRefilledAt: { type: "string", format: "date-time", nullable: true },
          nextHeartAt: { type: "string", format: "date-time", nullable: true },
          secondsUntilNextHeart: { type: "integer", example: 90 },
          minutesUntilNextHeart: { type: "integer", example: 2 },
          heartRefillIntervalSeconds: { type: "integer", example: 120 },
        },
        required: ["hearts", "maxHearts", "secondsUntilNextHeart", "minutesUntilNextHeart", "heartRefillIntervalSeconds"],
      },
      SubmitExerciseAttemptResponse: {
        allOf: [
          { $ref: "#/components/schemas/HeartState" },
          {
            type: "object",
            properties: {
              isCorrect: { type: "boolean", example: false },
              correctAnswer: {
                description: "Returned only when the submitted answer is incorrect. Shape depends on exercise type.",
                nullable: true,
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      selectedOptionId: { type: "integer", example: 1002 },
                      text: { type: "string", example: "Hello" },
                    },
                  },
                  { type: "string", example: "hello" },
                  {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        leftText: { type: "string", example: "hello" },
                        rightText: { type: "string", example: "xin chào" },
                      },
                    },
                  },
                ],
              },
              attempt: { $ref: "#/components/schemas/ExerciseAttempt" },
            },
            required: ["isCorrect", "attempt"],
          },
        ],
      },
      CompleteUnitResponse: {
        allOf: [
          { $ref: "#/components/schemas/HeartState" },
          {
            type: "object",
            properties: {
              completed: { type: "boolean", example: true },
              xpAwarded: { type: "integer", example: 28 },
              gemsAwarded: { type: "integer", example: 10 },
              streakIncremented: { type: "boolean", example: true },
              totalXp: { type: "integer", example: 448 },
              previousLevel: { type: "integer", example: 2 },
              level: { type: "integer", example: 3 },
              leveledUp: { type: "boolean", example: true },
              gems: { type: "integer", example: 28 },
              streak: { type: "integer", example: 6 },
              unitAttempt: { $ref: "#/components/schemas/UnitAttempt" },
              progress: { $ref: "#/components/schemas/UnitProgress" },
            },
            required: [
              "completed",
              "xpAwarded",
              "gemsAwarded",
              "streakIncremented",
              "totalXp",
              "previousLevel",
              "level",
              "leveledUp",
              "gems",
              "streak",
              "unitAttempt",
              "progress",
            ],
          },
        ],
      },
      HeartbeatSetting: {
        type: "object",
        properties: {
          heartRefillIntervalSeconds: { type: "integer", minimum: 1, example: 120 },
        },
        required: ["heartRefillIntervalSeconds"],
      },
      SectionAdmin: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Foundations" },
          subtitle: { type: "string", nullable: true, example: "Start here" },
          sortOrder: { type: "integer", example: 1 },
          isPublished: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "title", "sortOrder", "isPublished", "createdAt", "updatedAt"],
      },
      UnitAdmin: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          sectionId: { type: "integer", example: 1 },
          title: { type: "string", nullable: true, example: "Greetings" },
          description: { type: "string", nullable: true, example: "Basic greeting phrases" },
          kind: { type: "string", enum: ["LESSON", "REVIEW", "CHECKPOINT"], example: "LESSON" },
          sortOrder: { type: "integer", example: 1 },
          xpReward: { type: "integer", example: 20 },
          isPublished: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "sectionId", "kind", "sortOrder", "xpReward", "isPublished", "createdAt", "updatedAt"],
      },
      ExerciseOptionAdmin: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1001 },
          text: { type: "string", example: "Hello" },
          sortOrder: { type: "integer", example: 1 },
        },
        required: ["id", "text", "sortOrder"],
      },
      MatchingPairAdmin: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2001 },
          leftText: { type: "string", example: "hello" },
          rightText: { type: "string", example: "xin chào" },
          sortOrder: { type: "integer", example: 1 },
        },
        required: ["id", "leftText", "rightText", "sortOrder"],
      },
      ExerciseAdmin: {
        type: "object",
        properties: {
          id: { type: "integer", example: 101 },
          unitId: { type: "integer", example: 1 },
          type: { type: "string", enum: ["MULTIPLE_CHOICE", "FILL_BLANK", "MATCHING"], example: "MULTIPLE_CHOICE" },
          prompt: { type: "string", example: "Choose the correct greeting" },
          answerText: { type: "string", nullable: true, example: "hello|hi" },
          correctOptionId: { type: "integer", nullable: true, example: 1002 },
          explanation: { type: "string", nullable: true, example: "Use the common greeting." },
          sortOrder: { type: "integer", example: 1 },
          xpReward: { type: "integer", example: 5 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          options: {
            type: "array",
            items: { $ref: "#/components/schemas/ExerciseOptionAdmin" },
          },
          matchingPairs: {
            type: "array",
            items: { $ref: "#/components/schemas/MatchingPairAdmin" },
          },
        },
        required: ["id", "unitId", "type", "prompt", "sortOrder", "xpReward", "createdAt", "updatedAt", "options", "matchingPairs"],
      },
      FlashcardAdmin: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          unitId: { type: "integer", example: 1 },
          word: { type: "string", example: "hello" },
          phonetic: { type: "string", nullable: true, example: "/həˈləʊ/" },
          meaning: { type: "string", example: "xin chào" },
          imageUrl: { type: "string", nullable: true, example: "https://example.com/hello.png" },
          sortOrder: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "unitId", "word", "meaning", "sortOrder", "createdAt", "updatedAt"],
      },
      UnitAdminWithNested: {
        allOf: [
          { $ref: "#/components/schemas/UnitAdmin" },
          {
            type: "object",
            properties: {
              flashcards: {
                type: "array",
                items: { $ref: "#/components/schemas/FlashcardAdmin" },
              },
              exercises: {
                type: "array",
                items: { $ref: "#/components/schemas/ExerciseAdmin" },
              },
            },
            required: ["flashcards", "exercises"],
          },
        ],
      },
      SectionAdminWithNested: {
        allOf: [
          { $ref: "#/components/schemas/SectionAdmin" },
          {
            type: "object",
            properties: {
              units: {
                type: "array",
                items: { $ref: "#/components/schemas/UnitAdminWithNested" },
              },
            },
            required: ["units"],
          },
        ],
      },
      AdminContentResponse: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: { $ref: "#/components/schemas/SectionAdminWithNested" },
          },
        },
        required: ["sections"],
      },
      SectionResponse: {
        type: "object",
        properties: {
          section: { $ref: "#/components/schemas/SectionAdmin" },
        },
        required: ["section"],
      },
      UnitAdminResponse: {
        type: "object",
        properties: {
          unit: { $ref: "#/components/schemas/UnitAdmin" },
        },
        required: ["unit"],
      },
      ExerciseAdminResponse: {
        type: "object",
        properties: {
          exercise: { $ref: "#/components/schemas/ExerciseAdmin" },
        },
        required: ["exercise"],
      },
      UsersResponse: {
        type: "object",
        properties: {
          users: {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          },
        },
        required: ["users"],
      },
      DeleteResponse: {
        type: "object",
        properties: {
          deleted: { type: "boolean", example: true },
        },
        required: ["deleted"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "learner@example.com" },
          password: { type: "string", example: "secret123" },
          name: { type: "string", example: "Learner" },
          age: { oneOf: [{ type: "integer", minimum: 0, maximum: 255 }, { type: "string", example: "20" }], nullable: true },
        },
        required: ["email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "learner@example.com" },
          password: { type: "string", example: "secret123" },
        },
        required: ["email", "password"],
      },
      ProfileUpdateRequest: {
        type: "object",
        description: "Only name, age, and avatar are accepted.",
        properties: {
          name: { type: "string", example: "Updated Learner" },
          age: {
            nullable: true,
            oneOf: [
              { type: "integer", minimum: 0, maximum: 255 },
              { type: "string", example: "21" },
            ],
          },
          avatar: { type: "string", nullable: true, example: "bear" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        properties: {
          currentPassword: { type: "string", example: "secret123" },
          newPassword: { type: "string", minLength: 6, example: "newsecret456" },
        },
        required: ["currentPassword", "newPassword"],
      },
      StartUnitAttemptRequest: {
        type: "object",
        description: "The current implementation ignores the request body.",
        additionalProperties: true,
      },
      SubmitExerciseAttemptRequest: {
        type: "object",
        description: "Request shape varies by exercise type. Always include unitAttemptId.",
        properties: {
          unitAttemptId: { type: "integer", minimum: 1, example: 12 },
          selectedOptionId: { type: "integer", minimum: 1, example: 1002 },
          answerText: { type: "string", example: "hello" },
          pairs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                leftText: { type: "string", example: "hello" },
                rightText: { type: "string", example: "xin chào" },
              },
              required: ["leftText", "rightText"],
            },
          },
        },
        required: ["unitAttemptId"],
      },
      CompleteUnitRequest: {
        type: "object",
        properties: {
          unitAttemptId: { type: "integer", minimum: 1, example: 12 },
        },
        required: ["unitAttemptId"],
      },
      HeartbeatUpdateRequest: {
        type: "object",
        description: "Current implementation accepts either heartRefillIntervalSeconds or seconds.",
        properties: {
          heartRefillIntervalSeconds: { type: "integer", minimum: 1, example: 120 },
          seconds: { type: "integer", minimum: 1, example: 120 },
        },
      },
      SectionMutationRequest: {
        type: "object",
        properties: {
          title: { type: "string", example: "Foundations" },
          subtitle: { type: "string", nullable: true, example: "Start here" },
          subTitle: { type: "string", nullable: true, example: "Start here" },
          sortOrder: { type: "integer", minimum: 1, example: 1 },
          isPublished: { type: "boolean", example: true },
        },
      },
      UnitMutationRequest: {
        type: "object",
        properties: {
          sectionId: { type: "integer", minimum: 1, example: 1 },
          title: { type: "string", nullable: true, example: "Greetings" },
          description: { type: "string", nullable: true, example: "Basic greeting phrases" },
          kind: { type: "string", enum: ["LESSON", "REVIEW", "CHECKPOINT"], example: "LESSON" },
          sortOrder: { type: "integer", minimum: 1, example: 1 },
          xpReward: { type: "integer", minimum: 1, example: 20 },
          isPublished: { type: "boolean", example: true },
        },
      },
      ExerciseOptionMutation: {
        type: "object",
        properties: {
          id: { type: "integer", minimum: 1, example: 1001 },
          text: { type: "string", example: "Hello" },
          isCorrect: { type: "boolean", example: true },
        },
        required: ["text"],
      },
      MatchingPairMutation: {
        type: "object",
        properties: {
          id: { type: "integer", minimum: 1, example: 2001 },
          leftText: { type: "string", example: "hello" },
          rightText: { type: "string", example: "xin chào" },
        },
        required: ["leftText", "rightText"],
      },
      ExerciseMutationRequest: {
        type: "object",
        description: "Current implementation supports MULTIPLE_CHOICE, FILL_BLANK, and MATCHING. Use options for multiple choice, matchingPairs for matching.",
        properties: {
          unitId: { type: "integer", minimum: 1, example: 1 },
          type: { type: "string", enum: ["MULTIPLE_CHOICE", "FILL_BLANK", "MATCHING"], example: "MULTIPLE_CHOICE" },
          prompt: { type: "string", example: "Choose the correct greeting" },
          answerText: { type: "string", nullable: true, example: "hello|hi" },
          correctOptionId: { type: "integer", nullable: true, minimum: 1, example: 1002 },
          explanation: { type: "string", nullable: true, example: "Use the common greeting." },
          sortOrder: { type: "integer", minimum: 1, example: 1 },
          xpReward: { type: "integer", minimum: 1, example: 5 },
          options: {
            type: "array",
            items: { $ref: "#/components/schemas/ExerciseOptionMutation" },
          },
          matchingPairs: {
            type: "array",
            items: { $ref: "#/components/schemas/MatchingPairMutation" },
          },
        },
      },
      AdminResetPasswordRequest: {
        type: "object",
        description: "Current implementation accepts either newPassword or password.",
        properties: {
          newPassword: { type: "string", minLength: 6, example: "newsecret456" },
          password: { type: "string", minLength: 6, example: "newsecret456" },
        },
      },
      ResetProgressRequest: {
        type: "object",
        description: "The current implementation ignores the request body.",
        additionalProperties: true,
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        security: [],
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
                example: { ok: true },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccess" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "EMAIL_ALREADY_EXISTS",
                    message: "Email is already registered",
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Authenticated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSuccess" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Email or password is incorrect",
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current user profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CurrentUserResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/leaderboard": {
      get: {
        tags: ["Users"],
        summary: "Get leaderboard",
        security: [],
        responses: {
          200: {
            description: "Leaderboard entries ordered by XP",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeaderboardResponse" },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/users/me": {
      patch: {
        tags: ["Users"],
        summary: "Update current user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProfileUpdateRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated user profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CurrentUserResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/users/me/password": {
      patch: {
        tags: ["Users"],
        summary: "Change current user password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Password changed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CurrentUserResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: {
            description: "Missing token or wrong current password",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  missingToken: {
                    value: {
                      error: { code: "MISSING_TOKEN", message: "Bearer token is required" },
                    },
                  },
                  invalidCredentials: {
                    value: {
                      error: { code: "INVALID_CREDENTIALS", message: "Current password is incorrect" },
                    },
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/sections": {
      get: {
        tags: ["Content"],
        summary: "Get published sections and unit map",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Published sections with unit progress for the current user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SectionsResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/units/{unitId}": {
      get: {
        tags: ["Content"],
        summary: "Get a published unit",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/unitId" }],
        responses: {
          200: {
            description: "Published unit payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnitResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: {
            description: "Unit not found or invalid unit ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "UNIT_NOT_FOUND",
                    message: "Unit not found",
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/units/{unitId}/exercises": {
      get: {
        tags: ["Content"],
        summary: "Get exercises for a published unit",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/unitId" }],
        responses: {
          200: {
            description: "Exercises without leaking answers",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnitExercisesResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: {
            description: "Unit not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "UNIT_NOT_FOUND",
                    message: "Unit not found",
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/flashcards": {
      get: {
        tags: ["Content"],
        summary: "Get flashcards",
        security: [],
        parameters: [{ $ref: "#/components/parameters/flashcardsUnitId" }],
        responses: {
          200: {
            description: "Flashcards, optionally filtered by unitId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FlashcardsResponse" },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/units/{unitId}/attempts/start": {
      post: {
        tags: ["Quiz"],
        summary: "Start a unit attempt",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/unitId" }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StartUnitAttemptRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Unit attempt created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StartUnitAttemptResponse" },
              },
            },
          },
          400: {
            description: "Invalid unit ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "INVALID_ID",
                    message: "unitId must be a positive numeric ID",
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: {
            description: "Unit not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "UNIT_NOT_FOUND",
                    message: "Unit not found",
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/exercises/{exerciseId}/attempts": {
      post: {
        tags: ["Quiz"],
        summary: "Submit an exercise attempt",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/exerciseId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SubmitExerciseAttemptRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Attempt recorded and heart state returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SubmitExerciseAttemptResponse" },
              },
            },
          },
          400: {
            description: "Invalid path ID, answer payload, or unit attempt mismatch",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  invalidId: {
                    value: {
                      error: {
                        code: "INVALID_ID",
                        message: "exerciseId must be a positive numeric ID",
                      },
                    },
                  },
                  invalidAnswer: {
                    value: {
                      error: {
                        code: "INVALID_ANSWER_PAYLOAD",
                        message: "answerText is required",
                      },
                    },
                  },
                  mismatch: {
                    value: {
                      error: {
                        code: "UNIT_ATTEMPT_MISMATCH",
                        message: "unitAttemptId does not belong to this user and exercise unit",
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: {
            description: "Exercise not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "EXERCISE_NOT_FOUND",
                    message: "Exercise not found",
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/units/{unitId}/complete": {
      post: {
        tags: ["Quiz"],
        summary: "Complete a unit attempt",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/unitId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CompleteUnitRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Unit completion recorded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CompleteUnitResponse" },
              },
            },
          },
          400: {
            description: "Invalid path/body IDs, incomplete unit, or attempt mismatch",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  invalidId: {
                    value: {
                      error: {
                        code: "INVALID_ID",
                        message: "unitId must be a positive numeric ID",
                      },
                    },
                  },
                  mismatch: {
                    value: {
                      error: {
                        code: "UNIT_ATTEMPT_MISMATCH",
                        message: "unitAttemptId does not belong to this user and unit",
                      },
                    },
                  },
                  incomplete: {
                    value: {
                      error: {
                        code: "UNIT_INCOMPLETE",
                        message: "All exercises in the unit must be attempted before completion",
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: {
            description: "Unit not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: {
                    code: "UNIT_NOT_FOUND",
                    message: "Unit not found",
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/settings/heartbeat": {
      get: {
        tags: ["Admin"],
        summary: "Get heartbeat setting",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current heart refill interval setting",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HeartbeatSetting" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      patch: {
        tags: ["Admin"],
        summary: "Update heartbeat setting",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HeartbeatUpdateRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated heart refill interval setting",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HeartbeatSetting" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/content": {
      get: {
        tags: ["Admin"],
        summary: "Get all content for admin management",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Sections with nested units, flashcards, exercises, options, and matching pairs",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminContentResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/sections": {
      post: {
        tags: ["Admin"],
        summary: "Create a section",
        description: "Admin only. Current implementation returns 200 with the created section.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SectionMutationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Section created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SectionResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/sections/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update a section",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SectionMutationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated section",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SectionResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          404: {
            description: "Section not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: { code: "SECTION_NOT_FOUND", message: "Section not found" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a section",
        description: "Admin only. Also deletes contained units through service logic. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          200: {
            description: "Section deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeleteResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          404: {
            description: "Section not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: { code: "SECTION_NOT_FOUND", message: "Section not found" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/units": {
      post: {
        tags: ["Admin"],
        summary: "Create a unit",
        description: "Admin only. Current implementation returns 200 with the created unit.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UnitMutationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Unit created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnitAdminResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/units/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update a unit",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UnitMutationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated unit",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnitAdminResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          404: {
            description: "Unit not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: { code: "UNIT_NOT_FOUND", message: "Unit not found" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete a unit",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          200: {
            description: "Unit deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeleteResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          404: {
            description: "Unit not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: { code: "UNIT_NOT_FOUND", message: "Unit not found" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/exercises": {
      post: {
        tags: ["Admin"],
        summary: "Create an exercise",
        description: "Admin only. Current implementation returns 200 with the created exercise.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExerciseMutationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Exercise created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExerciseAdminResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/exercises/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update an exercise",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExerciseMutationRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Updated exercise",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExerciseAdminResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          404: {
            description: "Exercise not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: { code: "EXERCISE_NOT_FOUND", message: "Exercise not found" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete an exercise",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/id" }],
        responses: {
          200: {
            description: "Exercise deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeleteResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          404: {
            description: "Exercise not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: { code: "EXERCISE_NOT_FOUND", message: "Exercise not found" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List users",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Users ordered by creation date descending",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UsersResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/users/{id}/password": {
      patch: {
        tags: ["Admin"],
        summary: "Reset a user's password",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/userId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "User password reset",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CurrentUserResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: { code: "USER_NOT_FOUND", message: "User not found" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/admin/users/{id}/progress/reset": {
      post: {
        tags: ["Admin"],
        summary: "Reset a user's progress",
        description: "Admin only. Non-admin authenticated users currently receive 403 ADMIN_REQUIRED.",
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/userId" }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetProgressRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "User progress reset",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CurrentUserResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/ForbiddenAdmin" },
          404: {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  error: { code: "USER_NOT_FOUND", message: "User not found" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
  },
};

module.exports = openapiSpec;
