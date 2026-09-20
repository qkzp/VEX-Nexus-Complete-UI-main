import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/account-forms";

export const metadata: Metadata = {
  title: "Reset Password | BoltCanvas",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Reset your password."
      description="Request a password reset for an existing BoltCanvas account."
      prompt={<p>Remembered it? <Link href="/login">Back to sign in</Link>.</p>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
