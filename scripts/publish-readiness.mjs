import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const checks = [];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!key || key in process.env) continue;
    const rawValue = trimmed.slice(separator + 1).trim();
    process.env[key] = rawValue.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
}

for (const envFile of [".env.production.local", ".env.production", ".env.local", ".env"]) {
  loadEnvFile(envFile);
}

function addCheck(level, name, ok, detail) {
  checks.push({ level, name, ok, detail });
}

function required(name) {
  const value = process.env[name]?.trim();
  addCheck("fail", name, Boolean(value), value ? "configured" : "missing");
}

function configured(name) {
  return Boolean(process.env[name]?.trim());
}

function configuredValue(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function parseUrl(value) {
  try {
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(normalized);
  } catch {
    return null;
  }
}

addCheck(
  "fail",
  "database URL",
  Boolean(configured("POSTGRES_PRISMA_URL") || configured("DATABASE_URL")),
  configured("POSTGRES_PRISMA_URL")
    ? "POSTGRES_PRISMA_URL configured"
    : configured("DATABASE_URL")
      ? "DATABASE_URL configured"
      : "missing POSTGRES_PRISMA_URL or DATABASE_URL",
);
required("AUTH_SECRET");

const appUrlSource = configured("NEXT_PUBLIC_APP_URL")
  ? "NEXT_PUBLIC_APP_URL"
  : configured("VERCEL_PROJECT_PRODUCTION_URL")
    ? "VERCEL_PROJECT_PRODUCTION_URL"
    : configured("VERCEL_URL")
      ? "VERCEL_URL"
      : "NEXT_PUBLIC_APP_URL";
const authUrlSource = configured("AUTH_URL")
  ? "AUTH_URL"
  : configured("NEXTAUTH_URL")
    ? "NEXTAUTH_URL"
  : configured("VERCEL_PROJECT_PRODUCTION_URL")
    ? "VERCEL_PROJECT_PRODUCTION_URL"
    : configured("VERCEL_URL")
      ? "VERCEL_URL"
      : "AUTH_URL";

const appUrl = configuredValue("NEXT_PUBLIC_APP_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL");
const authUrl = configuredValue("AUTH_URL", "NEXTAUTH_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL");

addCheck("fail", "app base URL", Boolean(appUrl), appUrl ? `${appUrlSource} configured` : "missing NEXT_PUBLIC_APP_URL or Vercel deployment URL");
addCheck("fail", "auth base URL", Boolean(authUrl), authUrl ? `${authUrlSource} configured` : "missing AUTH_URL, NEXTAUTH_URL, or Vercel deployment URL");

addCheck(
  "fail",
  "public/auth URL match",
  Boolean(appUrl && authUrl && appUrl === authUrl),
  appUrl && authUrl ? `${appUrl} vs ${authUrl}` : "one or both missing",
);

const appUrlParsed = parseUrl(appUrl);
const authUrlParsed = parseUrl(authUrl);
addCheck(
  "fail",
  "public app URL is deployable",
  Boolean(appUrlParsed && appUrlParsed.protocol === "https:" && appUrlParsed.hostname !== "localhost"),
  appUrl ? `${appUrlSource}=${appUrl}` : "missing",
);
addCheck(
  "fail",
  "auth URL is deployable",
  Boolean(authUrlParsed && authUrlParsed.protocol === "https:" && authUrlParsed.hostname !== "localhost"),
  authUrl ? `${authUrlSource}=${authUrl}` : "missing",
);

const smtpReady = configured("SMTP_HOST") && configured("SMTP_PORT") && configured("EMAIL_FROM");
addCheck("warn", "SMTP password reset delivery", smtpReady, smtpReady ? "configured" : "missing SMTP_HOST, SMTP_PORT, or EMAIL_FROM");

const vexTokenReady = configured("VEX_EVENTS_API_TOKEN");
addCheck("warn", "VEX Events official integration", vexTokenReady, vexTokenReady ? "configured" : "missing VEX_EVENTS_API_TOKEN");

addCheck(
  "fail",
  "production dev reset disabled",
  process.env.ALLOW_DEV_RESET !== "true",
  process.env.ALLOW_DEV_RESET === "true" ? "ALLOW_DEV_RESET=true" : "disabled",
);

addCheck(
  "fail",
  ".env.example present",
  fs.existsSync(path.join(root, ".env.example")),
  fs.existsSync(path.join(root, ".env.example")) ? "present" : "missing",
);

const failed = checks.filter((check) => check.level === "fail" && !check.ok);
const warned = checks.filter((check) => check.level === "warn" && !check.ok);
for (const check of checks) {
  const status = check.ok ? "PASS" : check.level === "warn" ? "WARN" : "FAIL";
  console.log(`${status}  ${check.name}  ${check.detail}`);
}

if (failed.length) {
  console.error(`\nPublish readiness check failed with ${failed.length} blocking issue(s) and ${warned.length} warning(s).`);
  process.exit(1);
}

if (warned.length) {
  console.warn(`\nPublish readiness passed with ${warned.length} warning(s).`);
  process.exit(0);
}

console.log("\nPublish readiness check passed.");
