import path from "path";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

  // Local SQLite — uses libsql adapter
  if (dbUrl.startsWith("file:")) {
    // Dynamic import to avoid requiring libsql in production (PostgreSQL)
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    const absolutePath = path.resolve(process.cwd(), dbUrl.replace(/^file:/, ""));
    const adapter = new PrismaLibSql({ url: `file:${absolutePath}` });
    return new PrismaClient({ adapter });
  }

  // PostgreSQL (Supabase, Vercel Postgres, etc.) — direct connection
  return new PrismaClient({
    datasourceUrl: dbUrl,
  } as never);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
