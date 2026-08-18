import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

export function getCliDatabaseUrl() {
  return process.env.DIRECT_URL || process.env.DATABASE_URL;
}

export function getRuntimeDatabaseUrl() {
  return process.env.DATABASE_URL;
}

function poolConfig(connectionString: string): PoolConfig {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const needsSsl =
    /supabase\.(co|com)/i.test(connectionString) ||
    sslMode === "require" ||
    sslMode === "verify-full" ||
    sslMode === "verify-ca";

  // node-pg treats sslmode=require as verify-full; that conflicts with hosted cert chains.
  url.searchParams.delete("sslmode");

  return {
    connectionString: url.toString(),
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  };
}

export function createPrismaAdapter(connectionString: string) {
  return new PrismaPg(new Pool(poolConfig(connectionString)));
}
