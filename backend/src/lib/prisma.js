const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
if (!databaseUrl.searchParams.has("allowPublicKeyRetrieval")) {
  databaseUrl.searchParams.set("allowPublicKeyRetrieval", "true");
}

const adapter = new PrismaMariaDb(databaseUrl.toString());
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
