import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/account-forms";
import { ensureDatabaseReady } from "@/lib/db";

export const metadata: Metadata = {
  title: "BoltCanvas | Team Accounts",
  description: "Sign in to BoltCanvas and continue into your real team workspace.",
};

type Params = Promise<{ callbackUrl?: string | string[]; reset?: string | string[]; database?: string | string[] }>;
function one(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }

export default async function HomePage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const session = await auth();
  let databaseUnavailable = one(params.database) === "offline";
  const callbackUrl = one(params.callbackUrl) || "/app/dashboard";

  if (session?.user?.id) {
    try {
      await ensureDatabaseReady();
      redirect(session.user.onboardingComplete ? callbackUrl : `/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } catch {
      databaseUnavailable = true;
    }
  }

  return (
    <AuthShell
      eyebrow="Team workspace access"
      title="Sign in to your workspace."
      description="Use your BoltCanvas account to reach the saved team workspace, robot configuration, autonomous planning, and official event tools."
      prompt={
        databaseUnavailable ? (
          <p role="alert">BoltCanvas is temporarily unavailable. Please try again shortly.</p>
        ) : (
          <p>Need an account? <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Create one</Link>.</p>
        )
      }
    >
      <LoginForm callbackUrl={callbackUrl} resetComplete={one(params.reset) === "1"} />
    </AuthShell>
  );
}
