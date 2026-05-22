const contentService = require("../services/contentService");

const parsePositiveInt = (value) => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

async function sections(req, res, next) {
  try {
    const sectionsData = await contentService.getSections(req.auth.userId);
    res.json({ sections: sectionsData });
  } catch (error) {
    next(error);
  }
}

async function unit(req, res, next) {
  try {
    const unitId = parsePositiveInt(req.params.unitId);
    if (!unitId) {
      res.status(404).json({ error: { code: "UNIT_NOT_FOUND", message: "Unit not found" } });
      return;
    }

    const unitData = await contentService.getUnit(req.auth.userId, unitId);
    res.json({ unit: unitData });
  } catch (error) {
    next(error);
  }
}

async function unitExercises(req, res, next) {
  try {
    const unitId = parsePositiveInt(req.params.unitId);
    if (!unitId) {
      res.status(404).json({ error: { code: "UNIT_NOT_FOUND", message: "Unit not found" } });
      return;
    }

    const exercises = await contentService.getUnitExercises(unitId);
    res.json({ exercises });
  } catch (error) {
    next(error);
  }
}

async function flashcards(req, res, next) {
  try {
    const hasUnitIdFilter = Object.prototype.hasOwnProperty.call(req.query, "unitId");
    const unitId = hasUnitIdFilter ? parsePositiveInt(req.query.unitId) : null;
    if (hasUnitIdFilter && !unitId) {
      res.json({ flashcards: [] });
      return;
    }

    const flashcardsData = await contentService.getFlashcards(unitId);
    res.json({ flashcards: flashcardsData });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  flashcards,
  sections,
  unit,
  unitExercises,
};
