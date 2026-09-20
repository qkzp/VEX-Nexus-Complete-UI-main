import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const marker = resolve(process.cwd(), ".boltcanvas-demo-initialized");
if (existsSync(marker)) {
  console.log("BoltCanvas demo database already initialized; preserving current demo data.");
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  console.log("First launch of DEV build: clearing old account/workspace test data...");
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE row record;
    BEGIN
      FOR row IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
      LOOP
        EXECUTE format('TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE', 'public', row.tablename);
      END LOOP;
    END $$;
  `);
  writeFileSync(marker, new Date().toISOString() + "\n", "utf8");
  console.log("Fresh DEV database ready. Enter the DEV key in the browser.");
} finally {
  await prisma.$disconnect();
}
