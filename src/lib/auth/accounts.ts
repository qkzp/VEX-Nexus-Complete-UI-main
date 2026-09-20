import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma, type ExperienceLevel, type ProgrammingLanguage, type TeamRoboticsRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateOpaqueToken, hashOpaqueToken, tokensMatch } from "@/lib/security/tokens";

const PASSWORD_ROUNDS = 12;
const USERNAME_PATTERN = /[^a-z0-9_]/g;
const LOGIN_WINDOW_MS = 1000 * 60 * 15;
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCKOUT_MS = 1000 * 60 * 15;
const REGISTRATION_WINDOW_MS = 1000 * 60 * 60;
const REGISTRATION_MAX_ATTEMPTS = 5;
const RESET_WINDOW_MS = 1000 * 60 * 60;
const RESET_MAX_ATTEMPTS = 3;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[\s.-]+/g, "_").replace(USERNAME_PATTERN, "");
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function assertValidNormalizedUsername(username: string) {
  if (username.length < 3) {
    throw new Error("Choose a username with at least 3 letters or numbers.");
  }
}

function authIdentifierTargetId(identifier: string) {
  return createHash("sha256").update(normalizeIdentifier(identifier)).digest("hex");
}

async function countFailedLoginAttempts(identifier: string, since: Date) {
  return prisma.auditLog.count({
    where: {
      action: "auth.login.failed",
      targetType: "AuthIdentifier",
      targetId: authIdentifierTargetId(identifier),
      createdAt: { gte: since },
    },
  });
}

async function recordAuthAudit(input: {
  action: string;
  identifier?: string;
  actorId?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const targetType = input.targetType ?? (input.identifier ? "AuthIdentifier" : "AuthEvent");
  const targetId = input.targetId ?? (input.identifier ? authIdentifierTargetId(input.identifier) : input.action);

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      targetType,
      targetId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

async function allowUnauthenticatedAttempt(action: string, identifier: string, windowMs: number, maximum: number) {
  const targetId = authIdentifierTargetId(identifier);
  const since = new Date(Date.now() - windowMs);
  const recentAttempts = await prisma.auditLog.count({
    where: { action, targetType: "AuthIdentifier", targetId, createdAt: { gte: since } },
  });
  if (recentAttempts >= maximum) return false;

  await recordAuthAudit({ action, identifier, metadata: { windowMs } });
  return true;
}

async function getLoginThrottleState(identifier: string) {
  const now = Date.now();
  const windowStart = new Date(now - LOGIN_WINDOW_MS);
  const failures = await countFailedLoginAttempts(identifier, windowStart);
  const locked = failures >= LOGIN_MAX_FAILURES;
  const retryAfterMinutes = locked ? Math.max(1, Math.ceil(LOGIN_LOCKOUT_MS / (1000 * 60))) : 0;

  return {
    failures,
    remainingAttempts: Math.max(0, LOGIN_MAX_FAILURES - failures),
    locked,
    retryAfterMinutes,
  };
}

export async function checkAccountIdentityAvailability(input: { email?: string; username?: string }) {
  const email = input.email ? normalizeIdentifier(input.email) : "";
  const username = input.username ? normalizeUsername(input.username) : "";

  const [emailMatch, usernameMatch] = await Promise.all([
    email
      ? prisma.user.findUnique({
          where: { email },
          select: { id: true },
        })
      : null,
    username
      ? prisma.user.findUnique({
          where: { username },
          select: { id: true },
        })
      : null,
  ]);

  return {
    normalizedUsername: username,
    emailAvailable: email ? !emailMatch : null,
    usernameAvailable: username ? !usernameMatch : null,
  };
}

export async function previewLoginAttempt(identifierInput: string, password: string) {
  const identifier = normalizeIdentifier(identifierInput);
  const throttle = await getLoginThrottleState(identifier);
  if (throttle.locked) {
    return {
      ok: false as const,
      reason: "locked" as const,
      message: `Too many failed login attempts. Wait about ${throttle.retryAfterMinutes} minutes and try again.`,
      remainingAttempts: 0,
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: normalizeUsername(identifier) }],
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      status: true,
    },
  });

  if (!user || !user.passwordHash || user.status !== "ACTIVE") {
    return {
      ok: false as const,
      reason: "invalid" as const,
      message:
        throttle.remainingAttempts <= 1
          ? "That email or password was not recognized. One more failed attempt will temporarily lock this sign-in."
          : "That email or password was not recognized.",
      remainingAttempts: throttle.remainingAttempts,
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return {
      ok: false as const,
      reason: "invalid" as const,
      message:
        throttle.remainingAttempts <= 1
          ? "That email or password was not recognized. One more failed attempt will temporarily lock this sign-in."
          : "That email or password was not recognized.",
      remainingAttempts: throttle.remainingAttempts,
    };
  }

  return { ok: true as const, user };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createUserAccount(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}) {
  const email = normalizeIdentifier(input.email);
  const name = input.name.trim();
  const username = normalizeUsername(input.username);
  assertValidNormalizedUsername(username);
  const allowed = await allowUnauthenticatedAttempt("auth.register.request", email, REGISTRATION_WINDOW_MS, REGISTRATION_MAX_ATTEMPTS);
  if (!allowed) return { ok: false as const, message: "Too many account attempts. Please wait and try again." };
  const availability = await checkAccountIdentityAvailability({ email, username });
  if (availability.emailAvailable === false) {
    return { ok: false as const, message: "We could not create an account with those details." };
  }
  if (availability.usernameAvailable === false) {
    return { ok: false as const, message: "That username is already taken." };
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      username,
      displayName: name,
      passwordHash,
      status: "ACTIVE",
      profile: { create: {} },
      preferences: { create: {} },
    },
    select: { id: true, email: true },
  });
  await recordAuthAudit({
    action: "auth.register.created",
    actorId: user.id,
    targetType: "User",
    targetId: user.id,
    metadata: { emailDomain: email.split("@")[1] ?? null, username },
  });
  return { ok: true as const, user };
}

export async function verifyUserCredentials(emailInput: string, password: string) {
  const identifier = normalizeIdentifier(emailInput);
  const throttle = await getLoginThrottleState(identifier);
  if (throttle.locked) {
    await recordAuthAudit({
      action: "auth.login.locked",
      identifier,
      metadata: { retryAfterMinutes: throttle.retryAfterMinutes, failures: throttle.failures },
    });
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: normalizeUsername(identifier) }],
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      status: true,
    },
  });
  if (!user || !user.passwordHash || user.status !== "ACTIVE") {
    const nextFailures = throttle.failures + 1;
    await recordAuthAudit({
      action: "auth.login.failed",
      identifier,
      actorId: user?.id ?? null,
      metadata: {
        reason: !user ? "missing-user" : !user.passwordHash ? "missing-password" : "inactive-user",
        failuresInWindow: nextFailures,
        locked: nextFailures >= LOGIN_MAX_FAILURES,
      },
    });
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const nextFailures = throttle.failures + 1;
    await recordAuthAudit({
      action: "auth.login.failed",
      identifier,
      actorId: user.id,
      metadata: {
        reason: "invalid-password",
        failuresInWindow: nextFailures,
        locked: nextFailures >= LOGIN_MAX_FAILURES,
      },
    });
    return null;
  }

  await recordAuthAudit({
    action: "auth.login.succeeded",
    identifier,
    actorId: user.id,
    metadata: { failuresBeforeSuccess: throttle.failures },
  });
  return user;
}

export async function completeUserOnboarding(
  userId: string,
  input: {
    displayName: string;
    username: string;
    teamNumber?: string;
    experienceLevel?: ExperienceLevel | null;
    preferredLanguage?: ProgrammingLanguage | null;
    roles: TeamRoboticsRole[];
  },
) {
  const displayName = input.displayName.trim();
  const username = normalizeUsername(input.username);
  assertValidNormalizedUsername(username);
  const teamNumber = input.teamNumber?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") || null;
  const usernameInUse = await prisma.user.findFirst({
    where: {
      username,
      NOT: { id: userId },
    },
    select: { id: true },
  });
  if (usernameInUse) {
    throw new Error("That username is already taken.");
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: displayName,
      displayName,
      username,
      profile: {
        upsert: {
          create: {
            teamNumber,
            experienceLevel: input.experienceLevel ?? null,
            preferredLanguage: input.preferredLanguage ?? null,
            roles: input.roles,
            onboardingCompletedAt: new Date(),
          },
          update: {
            teamNumber,
            experienceLevel: input.experienceLevel ?? null,
            preferredLanguage: input.preferredLanguage ?? null,
            roles: input.roles,
            onboardingCompletedAt: new Date(),
          },
        },
      },
    },
  });
}

export async function createPasswordResetRequest(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const allowed = await allowUnauthenticatedAttempt("auth.password-reset.request", email, RESET_WINDOW_MS, RESET_MAX_ATTEMPTS);
  if (!allowed) return { ok: true as const, email, resetUrl: null as string | null };
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") {
    return { ok: true as const, email, resetUrl: null as string | null };
  }

  const token = generateOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  return { ok: true as const, email, resetUrl: `/reset-password?token=${encodeURIComponent(token)}` };
}

export async function consumePasswordReset(token: string, password: string) {
  const candidates = await prisma.passwordResetToken.findMany({
    where: {
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      tokenHash: true,
      userId: true,
    },
  });
  const match = candidates.find((candidate: { tokenHash: string }) => tokensMatch(token, candidate.tokenHash));
  if (!match) {
    return { ok: false as const, message: "That reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: match.userId },
      data: { passwordHash, status: "ACTIVE" },
    }),
    prisma.passwordResetToken.update({
      where: { id: match.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return { ok: true as const };
}
