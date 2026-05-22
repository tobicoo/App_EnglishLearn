const quizService = require("../services/quizService");

const parsePositiveIntParam = (value) => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const sendInvalidId = (res, paramName) => {
  res.status(400).json({
    error: {
      code: "INVALID_ID",
      message: `${paramName} must be a positive numeric ID`,
    },
  });
};

async function startUnitAttempt(req, res, next) {
  try {
    const unitId = parsePositiveIntParam(req.params.unitId);
    if (!unitId) {
      sendInvalidId(res, "unitId");
      return;
    }

    const result = await quizService.startUnitAttempt(req.auth.userId, unitId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function submitExerciseAttempt(req, res, next) {
  try {
    const exerciseId = parsePositiveIntParam(req.params.exerciseId);
    if (!exerciseId) {
      sendInvalidId(res, "exerciseId");
      return;
    }

    const result = await quizService.submitExerciseAttempt(req.auth.userId, exerciseId, req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function completeUnit(req, res, next) {
  try {
    const unitId = parsePositiveIntParam(req.params.unitId);
    if (!unitId) {
      sendInvalidId(res, "unitId");
      return;
    }

    const result = await quizService.completeUnit(req.auth.userId, unitId, req.body || {});
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  completeUnit,
  startUnitAttempt,
  submitExerciseAttempt,
};
