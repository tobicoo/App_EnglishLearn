require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcrypt');
const { PrismaClient, ExerciseType, UnitProgressStatus, UserRole, XpLedgerSource } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const databaseUrl = new URL(process.env.DATABASE_URL);
if (!databaseUrl.searchParams.has('allowPublicKeyRetrieval')) {
  databaseUrl.searchParams.set('allowPublicKeyRetrieval', 'true');
}

const adapter = new PrismaMariaDb(databaseUrl.toString());
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 12;
const DEFAULT_LOCAL_ADMIN_EMAIL = 'admin@test.com';
const DEFAULT_LOCAL_ADMIN_PASSWORD = '123123';

const MATCHING_EXERCISE_ID = 1001;
const MATCHING_UNIT_ID = 1;
const HEART_REFILL_INTERVAL_SECONDS_KEY = 'heart_refill_interval_seconds';

const stableIntId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const requireStableId = (entityName, value) => {
  const id = stableIntId(value);
  if (!id) {
    throw new Error(`${entityName} requires a positive numeric id, received ${value}`);
  }
  return id;
};

const exerciseTypeForQuiz = (type) => {
  if (type === 'multiple_choice') return ExerciseType.MULTIPLE_CHOICE;
  if (type === 'fill_blank' || type === 'translate') return ExerciseType.FILL_BLANK;
  if (type === 'matching') return ExerciseType.MATCHING;
  throw new Error(`Unsupported quiz type: ${type}`);
};

const getAnswerText = (quiz) => {
  if (typeof quiz.answer === 'string') return quiz.answer;
  if (Array.isArray(quiz.options) && Number.isInteger(quiz.answer)) {
    return quiz.options[quiz.answer] ?? null;
  }
  return null;
};

const ensureAutoIncrementAfterStableIds = async (tableName, minimumNextId) => {
  await prisma.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = ${minimumNextId}`);
};

const seedUsers = async (users) => {
  const userIdBySourceId = new Map();

  for (const user of users) {
    const numericId = stableIntId(user.id);
    const passwordHash = await bcrypt.hash(String(user.password ?? ''), SALT_ROUNDS);
    const data = {
      email: user.email,
      passwordHash,
      name: user.name,
      age: user.age ?? null,
      avatar: user.avatar ?? null,
      level: user.level ?? 1,
      totalXp: user.xp ?? 0,
      streak: user.streak ?? 0,
      gems: user.gems ?? 0,
      hearts: user.hearts ?? 5,
      maxHearts: Math.max(user.hearts ?? 5, 5),
    };

    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: data,
      create: numericId ? { id: numericId, ...data } : data,
    });

    userIdBySourceId.set(String(user.id), savedUser.id);
  }

  return userIdBySourceId;
};

const seedSystemSettings = async () => {
  await prisma.appSetting.upsert({
    where: { key: HEART_REFILL_INTERVAL_SECONDS_KEY },
    update: {},
    create: {
      key: HEART_REFILL_INTERVAL_SECONDS_KEY,
      value: '120',
    },
  });
};

const seedAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? null : DEFAULT_LOCAL_ADMIN_EMAIL);
  const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? null : DEFAULT_LOCAL_ADMIN_PASSWORD);

  if (!adminEmail || !adminPassword) {
    return;
  }

  const normalizedEmail = adminEmail.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: 'Admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: normalizedEmail,
      passwordHash,
      name: 'Admin',
      role: UserRole.ADMIN,
    },
  });
};

const seedSections = async (sections) => {
  for (const section of sections) {
    const id = requireStableId('Section', section.id);
    await prisma.section.upsert({
      where: { id },
      update: {
        title: section.title,
        subtitle: section.subTitle ?? null,
        sortOrder: id,
        isPublished: true,
      },
      create: {
        id,
        title: section.title,
        subtitle: section.subTitle ?? null,
        sortOrder: id,
        isPublished: true,
      },
    });
  }
};

const seedUnits = async (units) => {
  for (const unit of units) {
    const id = requireStableId('Unit', unit.id);
    await prisma.unit.upsert({
      where: { id },
      update: {
        sectionId: unit.sectionId,
        title: `Unit ${unit.order}`,
        sortOrder: unit.order,
        isPublished: true,
      },
      create: {
        id,
        sectionId: unit.sectionId,
        title: `Unit ${unit.order}`,
        sortOrder: unit.order,
        isPublished: true,
      },
    });
  }
};

const seedFlashcards = async (flashcards) => {
  const orderByUnit = new Map();

  for (const flashcard of flashcards) {
    const id = requireStableId('Flashcard', flashcard.id);
    const sortOrder = (orderByUnit.get(flashcard.unitId) ?? 0) + 1;
    orderByUnit.set(flashcard.unitId, sortOrder);

    await prisma.flashcard.upsert({
      where: { id },
      update: {
        unitId: flashcard.unitId,
        word: flashcard.word,
        phonetic: flashcard.phonetic ?? null,
        meaning: flashcard.meaning,
        imageUrl: flashcard.imageUrl ?? null,
        sortOrder,
      },
      create: {
        id,
        unitId: flashcard.unitId,
        word: flashcard.word,
        phonetic: flashcard.phonetic ?? null,
        meaning: flashcard.meaning,
        imageUrl: flashcard.imageUrl ?? null,
        sortOrder,
      },
    });
  }
};

const seedExerciseOptions = async (exerciseId, options = [], answer) => {
  await prisma.exercise.update({ where: { id: exerciseId }, data: { correctOptionId: null } });

  const optionIds = [];
  for (const [index, option] of options.entries()) {
    const sortOrder = index + 1;
    const savedOption = await prisma.exerciseOption.upsert({
      where: { exerciseId_sortOrder: { exerciseId, sortOrder } },
      update: { text: option },
      create: { exerciseId, text: option, sortOrder },
    });
    optionIds.push(savedOption.id);
  }

  await prisma.exerciseOption.deleteMany({
    where: { exerciseId, sortOrder: { gt: options.length } },
  });

  if (Number.isInteger(answer) && optionIds[answer]) {
    await prisma.exercise.update({
      where: { id: exerciseId },
      data: { correctOptionId: optionIds[answer] },
    });
  }
};

const seedExercises = async (quizzes) => {
  const orderByUnit = new Map();

  for (const quiz of quizzes) {
    const id = requireStableId('Exercise', quiz.id);
    const sortOrder = (orderByUnit.get(quiz.unitId) ?? 0) + 1;
    orderByUnit.set(quiz.unitId, sortOrder);

    const exercise = await prisma.exercise.upsert({
      where: { id },
      update: {
        unitId: quiz.unitId,
        type: exerciseTypeForQuiz(quiz.type),
        prompt: quiz.question,
        answerText: getAnswerText(quiz),
        sortOrder,
      },
      create: {
        id,
        unitId: quiz.unitId,
        type: exerciseTypeForQuiz(quiz.type),
        prompt: quiz.question,
        answerText: getAnswerText(quiz),
        sortOrder,
      },
    });

    await seedExerciseOptions(exercise.id, quiz.options ?? [], quiz.answer);
    await prisma.matchingPair.deleteMany({ where: { exerciseId: exercise.id } });
  }
};

const seedMinimalMatchingExercise = async () => {
  const existingMatchingCount = await prisma.exercise.count({ where: { type: ExerciseType.MATCHING } });
  if (existingMatchingCount > 0) return;

  const lastUnitOneExercise = await prisma.exercise.findFirst({
    where: { unitId: MATCHING_UNIT_ID },
    orderBy: { sortOrder: 'desc' },
  });

  const matchingExercise = await prisma.exercise.upsert({
    where: { id: MATCHING_EXERCISE_ID },
    update: {
      unitId: MATCHING_UNIT_ID,
      type: ExerciseType.MATCHING,
      prompt: 'Match each greeting with its Vietnamese meaning.',
      answerText: null,
      sortOrder: (lastUnitOneExercise?.sortOrder ?? 0) + 1,
    },
    create: {
      id: MATCHING_EXERCISE_ID,
      unitId: MATCHING_UNIT_ID,
      type: ExerciseType.MATCHING,
      prompt: 'Match each greeting with its Vietnamese meaning.',
      sortOrder: (lastUnitOneExercise?.sortOrder ?? 0) + 1,
    },
  });

  await prisma.exercise.update({ where: { id: matchingExercise.id }, data: { correctOptionId: null } });
  await prisma.exerciseOption.deleteMany({ where: { exerciseId: matchingExercise.id } });

  const pairs = [
    ['Hello', 'Xin chào'],
    ['Goodbye', 'Tạm biệt'],
    ['Thank you', 'Cảm ơn'],
  ];

  for (const [index, [leftText, rightText]] of pairs.entries()) {
    const sortOrder = index + 1;
    await prisma.matchingPair.upsert({
      where: { exerciseId_sortOrder: { exerciseId: matchingExercise.id, sortOrder } },
      update: { leftText, rightText },
      create: { exerciseId: matchingExercise.id, leftText, rightText, sortOrder },
    });
  }

  await prisma.matchingPair.deleteMany({
    where: { exerciseId: matchingExercise.id, sortOrder: { gt: pairs.length } },
  });
};

const seedProgress = async (users, userIdBySourceId) => {
  const units = await prisma.unit.findMany({ select: { id: true } });
  const exerciseCounts = await prisma.exercise.groupBy({
    by: ['unitId'],
    _count: { _all: true },
  });
  const exerciseCountByUnit = new Map(exerciseCounts.map((entry) => [entry.unitId, entry._count._all]));
  const unitIds = units.map((unit) => unit.id);

  for (const sourceUser of users) {
    const userId = userIdBySourceId.get(String(sourceUser.id));
    if (!userId) continue;

    const completedUnitIds = new Set((sourceUser.completedUnitIds ?? []).map(Number));
    const firstIncompleteUnitId = unitIds.find((unitId) => !completedUnitIds.has(unitId));

    for (const unitId of unitIds) {
      const totalExercises = exerciseCountByUnit.get(unitId) ?? 0;
      const completed = completedUnitIds.has(unitId);
      const inProgress = !completed && unitId === firstIncompleteUnitId;
      const status = completed
        ? UnitProgressStatus.COMPLETED
        : inProgress
          ? UnitProgressStatus.IN_PROGRESS
          : UnitProgressStatus.NOT_STARTED;

      await prisma.userUnitProgress.upsert({
        where: { userId_unitId: { userId, unitId } },
        update: {
          status,
          totalExercises,
          completedExercises: completed ? totalExercises : 0,
          bestScore: completed ? 100 : null,
          completedAt: completed ? new Date('2026-05-21T00:00:00.000Z') : null,
        },
        create: {
          userId,
          unitId,
          status,
          totalExercises,
          completedExercises: completed ? totalExercises : 0,
          bestScore: completed ? 100 : null,
          completedAt: completed ? new Date('2026-05-21T00:00:00.000Z') : null,
        },
      });
    }

    await prisma.xpLedger.upsert({
      where: { userId_idempotencyKey: { userId, idempotencyKey: 'seed:db-json-total-xp' } },
      update: {
        source: XpLedgerSource.MANUAL_ADJUSTMENT,
        amount: sourceUser.xp ?? 0,
      },
      create: {
        userId,
        source: XpLedgerSource.MANUAL_ADJUSTMENT,
        idempotencyKey: 'seed:db-json-total-xp',
        amount: sourceUser.xp ?? 0,
      },
    });
  }
};

const seedLeaderboardProfiles = async (leaderboard) => {
  for (const entry of leaderboard) {
    const syntheticEmail = `leaderboard-${entry.id}@seed.local`;
    const passwordHash = await bcrypt.hash(`leaderboard-${entry.id}`, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: syntheticEmail },
      update: {
        name: entry.name,
        avatar: entry.avatar ?? null,
        totalXp: entry.xp ?? 0,
        passwordHash,
      },
      create: {
        email: syntheticEmail,
        passwordHash,
        name: entry.name,
        avatar: entry.avatar ?? null,
        totalXp: entry.xp ?? 0,
      },
    });
  }
};

async function main() {
  const dbPath = path.join(__dirname, '..', 'db.json');
  const db = JSON.parse(await fs.readFile(dbPath, 'utf8'));

  await seedSections(db.sections ?? []);
  await seedUnits(db.units ?? []);
  await seedFlashcards(db.flashcards ?? []);
  await seedExercises(db.quizzes ?? []);
  await seedMinimalMatchingExercise();
  await seedSystemSettings();

  const userIdBySourceId = await seedUsers(db.users ?? []);
  await seedAdminUser();
  await seedLeaderboardProfiles(db.leaderboard ?? []);
  await seedProgress(db.users ?? [], userIdBySourceId);

  await ensureAutoIncrementAfterStableIds('sections', 1000);
  await ensureAutoIncrementAfterStableIds('units', 1000);
  await ensureAutoIncrementAfterStableIds('flashcards', 1000);
  await ensureAutoIncrementAfterStableIds('exercises', 2000);

  console.log('Seeded db.json content into Prisma/MySQL tables.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
