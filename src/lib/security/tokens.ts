import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return digest(token);
}

export function tokensMatch(token: string, hash: string) {
  const candidate = Buffer.from(hashOpaqueToken(token), "hex");
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function normalizeTeamNumber(teamNumber: string) {
  return teamNumber.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export function createInviteCode(teamNumber: string) {
  const normalized = normalizeTeamNumber(teamNumber) || "TEAM";
  return "NX-" + normalized + "-" + randomBytes(9).toString("hex").toUpperCase();
}

export function hashInviteCode(code: string) {
  return hashOpaqueToken(code.trim().toUpperCase());
}
