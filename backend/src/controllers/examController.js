const examService = require("../services/examService");

async function listExams(req, res, next) {
  try {
    const userId = req.auth?.userId || null;
    const result = await examService.listPublicExams(userId, {
      category: req.query.category,
      difficulty: req.query.difficulty,
      search: req.query.search,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function createExam(req, res, next) {
  try {
    const exam = await examService.createExam(req.auth.userId, req.body || {});
    res.status(201).json({ exam });
  } catch (error) {
    next(error);
  }
}

async function myExams(req, res, next) {
  try {
    const result = await examService.getMyExams(req.auth.userId, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function savedExams(req, res, next) {
  try {
    const result = await examService.getSavedExams(req.auth.userId, {
      limit: req.query.limit,
      offset: req.query.offset,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function toggleBookmark(req, res, next) {
  try {
    const result = await examService.toggleBookmark(req.auth.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function removeBookmark(req, res, next) {
  try {
    const result = await examService.removeBookmark(req.auth.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getQuestions(req, res, next) {
  try {
    const requesterId = req.auth?.userId || null;
    const result = await examService.getExamQuestions(req.params.id, requesterId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function addQuestion(req, res, next) {
  try {
    const question = await examService.addQuestion(req.params.id, req.auth.userId, req.body || {});
    res.status(201).json({ question });
  } catch (error) {
    next(error);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    const result = await examService.deleteQuestion(req.params.id, req.params.questionId, req.auth.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addQuestion,
  createExam,
  deleteQuestion,
  getQuestions,
  listExams,
  myExams,
  removeBookmark,
  savedExams,
  toggleBookmark,
};
