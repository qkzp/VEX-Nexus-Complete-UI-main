import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * A single Prisma client is reused during local Next.js hot reloads. The client
 * does not connect until a query is made, which keeps public pages buildable
 * when a developer has not configured a local database yet.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function databaseIsConfigured() {
  return Boolean(process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL);
}

export function requireDatabaseConfiguration() {
  if (!databaseIsConfigured()) {
    throw new Error(
      "Database access is not configured. Set POSTGRES_PRISMA_URL or DATABASE_URL before using authenticated PitRelay features.",
    );
  }
}

export function databaseErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return null;

  if (error.message.includes("Database access is not configured")) {
    return "The local database is not configured yet. Start the app with `npm run local`.";
  }

  if (error.message.includes("The local database is not configured yet.")) {
    return error.message;
  }

  if (
    error.message.includes("Can't reach database server") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("connect ETIMEDOUT") ||
    error.message.includes("Connection refused")
  ) {
    return "The local database is not running. Start Docker Desktop, then run `npm run local` and try again.";
  }

  if (error.message.includes("The local database is not running.")) {
    return error.message;
  }

  if (
    error.message.includes("The table `public.User` does not exist") ||
    error.message.includes("The table `public.") ||
    error.message.includes("relation \"public.") ||
    error.message.includes("relation \"User\" does not exist")
  ) {
    return "The database is connected, but the Prisma schema has not been deployed yet. Run `npm run db:deploy` against the production database, then redeploy.";
  }

  return null;
}

export async function ensureDatabaseReady() {
  requireDatabaseConfiguration();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const message = databaseErrorMessage(error);
    if (message) throw new Error(message);
    throw error;
  }
}

export async function withDatabaseFallback<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (databaseErrorMessage(error)) {
      return fallback;
    }
    throw error;
  }
}
