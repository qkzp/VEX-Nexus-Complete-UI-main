export function safeCallbackUrl(value: unknown, fallback = "/app/dashboard"): string {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\r\n]/.test(path)) return fallback;
  const url = new URL(path, "https://workspace.invalid");
  if (url.origin !== "https://workspace.invalid" || ["/", "/login", "/register", "/forgot-password", "/reset-password"].includes(url.pathname)) return fallback;
  return path;
}
