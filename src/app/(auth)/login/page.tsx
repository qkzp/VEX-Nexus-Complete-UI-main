import { safeCallbackUrl } from "@/lib/safe-redirect";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/account-forms";

export const metadata: Metadata = {
  title: "Sign In | BoltCanvas",
};

type Params = Promise<{
  callbackUrl?: string | string[];
  database?: string | string[];
  reset?: string | string[];
}>;
function one(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }

export default async function LoginPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const session = await auth();
  const callbackUrl = safeCallbackUrl(one(params.callbackUrl), "/app/dashboard");
  const databaseUnavailable = one(params.database) === "offline";

  if (session?.user?.id) {
    redirect(session.user.onboardingComplete ? callbackUrl : `/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <AuthShell
      eyebrow="Account access"
      title="Sign in"
      description="Open the shared engineering workspace attached to your BoltCanvas account."
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
