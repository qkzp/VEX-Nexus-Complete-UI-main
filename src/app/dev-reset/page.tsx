import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/authz";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetDemoForm } from "@/components/auth/dev-gate-form";
import { localDevelopmentToolsEnabled } from "@/lib/runtime-environment";

export const metadata: Metadata = { title: "Reset demo | BoltCanvas" };

export default async function DevResetPage() {
  if (!localDevelopmentToolsEnabled()) notFound();
  await requireCurrentUser("/dev-reset");
  return (
    <AuthShell
      eyebrow="DEV maintenance"
      title="Reset the demo workspace."
      description="Use this when you want to test BoltCanvas again as a completely fresh user. This operation is intentionally destructive."
    >
      <ResetDemoForm />
    </AuthShell>
  );
}
