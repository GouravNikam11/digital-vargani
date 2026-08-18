import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const cliUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || env("DATABASE_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prisma CLI (migrate / studio) needs a session/direct connection, not the transaction pooler.
    url: cliUrl,
  },
});
