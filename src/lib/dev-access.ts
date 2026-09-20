import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { localDevelopmentToolsEnabled } from "@/lib/runtime-environment";

export const DEV_USER_EMAIL = "dev@vex-nexus.local";
export const DEV_USER_NAME = "DEV Workspace";

export function devAccessConfigured() {
  return localDevelopmentToolsEnabled() && Boolean(process.env.DEV_ACCESS_KEY?.trim());
}

export function validDevAccessKey(input: string) {
  if (!localDevelopmentToolsEnabled()) return false;
  const expected = process.env.DEV_ACCESS_KEY?.trim() ?? "";
  const supplied = input.trim();
  if (!expected || !supplied) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function ensureDevUser() {
  const now = new Date();
  return prisma.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {
      name: DEV_USER_NAME,
      displayName: DEV_USER_NAME,
      username: null,
      passwordHash: null,
      status: "ACTIVE",
      profile: {
        upsert: {
          create: { onboardingCompletedAt: now },
          update: {
            experienceLevel: null,
            preferredLanguage: null,
            roles: [],
            bio: null,
            onboardingCompletedAt: now,
          },
        },
      },
      preferences: {
        upsert: {
          create: {},
          update: {
            defaultTeamId: null,
            defaultRobotId: null,
            profilePublic: false,
            robotsPublic: false,
            activityPublic: false,
          },
        },
      },
    },
    create: {
      email: DEV_USER_EMAIL,
      name: DEV_USER_NAME,
      displayName: DEV_USER_NAME,
      status: "ACTIVE",
      profile: { create: { onboardingCompletedAt: now } },
      preferences: { create: {} },
    },
    include: { profile: true },
  });
}

/**
 * Local/demo-only destructive reset. This intentionally clears application data
 * but keeps Prisma migration history intact. The next DEV-key entry recreates
 * the synthetic demo user with a blank workspace.
 */
export async function resetAllDemoData() {
  if (!localDevelopmentToolsEnabled()) {
    throw new Error("Demo reset is disabled in production.");
  }

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
}
