// lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Prisma 7 removed the bundled Rust query engine. A driver adapter is now
 * REQUIRED — constructing `new PrismaClient()` without one throws:
 *
 *   "PrismaClient requires a driver adapter to connect to your database,
 *    but none was provided."
 *
 * PrismaNeon takes the connection string directly and manages pooling,
 * so we don't create a Pool ourselves.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Don't throw here: `next build` imports this module while collecting page
  // data, so throwing would fail the whole build instead of just the request.
  // Prisma will surface a connection error when a query actually runs.
  console.error(
    "[prisma] DATABASE_URL is not set — database queries will fail.",
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: connectionString ?? "" });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Reuse the client across hot reloads in dev to avoid exhausting connections.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
