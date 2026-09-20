import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/account-forms";

export const metadata: Metadata = {
  title: "Create Account | PitRelay",
};

type Params = Promise<{ callbackUrl?: string | string[] }>;
function one(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }

export default async function RegisterPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const session = await auth();
  const callbackUrl = one(params.callbackUrl) || "/onboarding";

  if (session?.user?.id) {
    redirect(session.user.onboardingComplete ? "/app/dashboard" : `/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Build your team identity."
      description="Create a real PitRelay account so your team membership, robots, routes, and planning history stay attached to you."
      prompt={<p>Already have one? <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Sign in</Link>.</p>}
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
