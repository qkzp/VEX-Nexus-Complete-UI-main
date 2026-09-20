import nodemailer from "nodemailer";
import { appBaseUrl, smtpConfigured } from "@/lib/runtime-environment";

function smtpPort() {
  const parsed = Number(process.env.SMTP_PORT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 587;
}

function smtpSecure() {
  return process.env.SMTP_SECURE === "true" || smtpPort() === 465;
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    secure: smtpSecure(),
    auth: process.env.SMTP_USER?.trim()
      ? {
          user: process.env.SMTP_USER?.trim(),
          pass: process.env.SMTP_PASSWORD?.trim() ?? "",
        }
      : undefined,
  });
}

export async function sendPasswordResetEmail(options: { to: string; resetPath: string }) {
  if (!smtpConfigured()) {
    throw new Error("SMTP delivery is not configured for password reset email.");
  }

  const resetUrl = `${appBaseUrl()}${options.resetPath.startsWith("/") ? options.resetPath : `/${options.resetPath}`}`;
  const from = process.env.EMAIL_FROM!.trim();
  await transporter().sendMail({
    from,
    to: options.to,
    subject: "Reset your PitRelay password",
    text: [
      "A password reset was requested for your PitRelay account.",
      "",
      "Open the link below to choose a new password:",
      resetUrl,
      "",
      "This link expires in 30 minutes.",
      "",
      "If you did not request this, you can ignore this message.",
    ].join("\n"),
    html: [
      "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#10213a\">",
      "<p>A password reset was requested for your PitRelay account.</p>",
      "<p>Use the button below to choose a new password:</p>",
      `<p><a href="${resetUrl}" style="display:inline-block;background:#2469d8;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Reset your password</a></p>`,
      `<p style="word-break:break-all;color:#4b5f7d">${resetUrl}</p>`,
      "<p>This link expires in 30 minutes.</p>",
      "<p>If you did not request this, you can ignore this message.</p>",
      "</div>",
    ].join(""),
  });
}
