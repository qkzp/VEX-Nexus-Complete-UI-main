import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/account-forms";

export const metadata: Metadata = {
  title: "Choose New Password | PitRelay",
};

type Params = Promise<{ token?: string | string[] }>;
function one(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Choose a new password."
      description="Finish the reset flow from your email link, then sign back into your PitRelay account."
      prompt={<p>Need a new reset link? <Link href="/forgot-password">Generate one</Link>.</p>}
    >
      <ResetPasswordForm token={one(params.token)} />
    </AuthShell>
  );
}
