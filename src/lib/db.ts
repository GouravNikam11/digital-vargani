import { PrismaClient } from "@/generated/prisma/client";
import { createPrismaAdapter, getRuntimeDatabaseUrl } from "@/lib/prisma-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = getRuntimeDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({ adapter: createPrismaAdapter(connectionString) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
