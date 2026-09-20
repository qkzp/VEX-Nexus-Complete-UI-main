import { safeCallbackUrl } from "@/lib/safe-redirect";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingForm } from "@/components/auth/account-forms";
import styles from "@/components/auth/auth-ui.module.css";

type Params = Promise<{ callbackUrl?: string | string[] }>;
function one(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }

export default async function OnboardingPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const session = await auth();
  const callbackUrl = safeCallbackUrl(one(params.callbackUrl), "/app/dashboard");

  if (!session?.user?.id || !session.user.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (session.user.onboardingComplete) {
    redirect(callbackUrl.split("?")[0] === "/onboarding" ? "/app/dashboard" : callbackUrl);
  }

  return (
    <main className={styles["onboarding-shell"]}>
      <header className={styles["onboarding-topbar"]}>
        <Link className={styles["onboarding-brand"]} href="/" aria-label="BoltCanvas home">
          <Image className={styles["onboarding-brand-logo"]} src="/boltcanvas-mark.svg" alt="" width={30} height={30} priority />
          <span>BOLTCANVAS</span>
        </Link>
        <span className={styles["onboarding-progress"]}>PROFILE SETUP / STEP 1 OF 1</span>
      </header>
      <section className={styles["onboarding-main"]}>
        <div className={styles["onboarding-intro"]}>
          <p className={styles["onboarding-eyebrow"]}>Account setup</p>
          <h1>Finish your workspace profile.</h1>
          <p>
            Add the details that make team collaboration usable: who you are, what team you usually work with, and how you contribute.
          </p>
        </div>
        <OnboardingForm
          email={session.user.email}
          displayName={session.user.name || session.user.email}
          username={session.user.username || ""}
          callbackUrl={callbackUrl}
        />
      </section>
    </main>
  );
}
