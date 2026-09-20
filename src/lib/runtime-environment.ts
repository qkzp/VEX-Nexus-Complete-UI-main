import process from "node:process";

export function isProductionDeployment() {
  return process.env.NODE_ENV === "production";
}

function normalizeAbsoluteUrl(raw: string | undefined) {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function localDevelopmentToolsEnabled() {
  return !isProductionDeployment() && process.env.ENABLE_LOCAL_DEV_TOOLS === "true";
}

export function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.EMAIL_FROM?.trim(),
  );
}

export function appBaseUrl() {
  const configured =
    normalizeAbsoluteUrl(process.env.AUTH_URL) ||
    normalizeAbsoluteUrl(process.env.NEXTAUTH_URL) ||
    normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeAbsoluteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeAbsoluteUrl(process.env.VERCEL_URL);

  return configured ?? "https://vex-nexus-complete-ui.vercel.app";
}
