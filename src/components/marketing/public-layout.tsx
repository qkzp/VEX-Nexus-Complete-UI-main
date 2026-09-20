import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Database, ExternalLink, LockKeyhole, ShieldCheck, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./public-ui.module.css";

export function PublicHeader() {
  return (
    <header className={styles["public-header"]}>
      <Link className={styles["public-logo"]} href="/" aria-label="PitRelay home">
        <Image className={styles["public-logo-image"]} src="/pitrelay-mark.svg" alt="" width={34} height={34} priority />
        PITRELAY
      </Link>
      <nav className={styles["public-nav"]} aria-label="Main navigation">
        <a href="#workflow">Workflow</a>
        <a href="#standards">Standards</a>
        <a href="#getting-started">Getting started</a>
      </nav>
      <div className={styles["public-header-actions"]}>
        <Link className={`${styles["public-button"]} ${styles["public-button-secondary"]}`} href="/register">Create account</Link>
        <Link className={`${styles["public-button"]} ${styles["public-button-primary"]}`} href="/login">Sign in</Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className={styles["public-footer"]}>
      <span>PitRelay | private team operations</span>
      <div className={styles["public-footer-links"]}>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/login">Sign in</Link>
      </div>
    </footer>
  );
}

export function PublicLanding() {
  return (
    <main className={styles["public-site"]}>
      <PublicHeader />
      <section className={styles["public-hero"]}>
        <div className={styles["public-hero-copy"]}>
          <p className={styles["public-eyebrow"]}>VEX V5 | Override 2026-27</p>
          <h1>Your VEX season, engineered in one place.</h1>
          <p className={styles["public-hero-lede"]}>
            Code, robot configuration, team execution, the real Override field, and official World Skills access built into one competition workspace for VEX teams.
          </p>
          <div className={styles["public-hero-actions"]}>
            <Link className={`${styles["public-button"]} ${styles["public-button-primary"]}`} href="/register">Create workspace account <ArrowRight aria-hidden="true" /></Link>
            <Link className={`${styles["public-button"]} ${styles["public-button-secondary"]}`} href="/login">Sign in</Link>
          </div>
          <div className={styles["public-hero-caption"]}>
            <strong>Designed for real teams</strong>
            <span>Invite members, keep engineering artifacts team-scoped, and connect official event information only when the source is available.</span>
          </div>
        </div>
        <aside className={styles["public-field-stage"]} aria-label="2026-27 VEX Override competition field">
          <div className={styles["public-field-topline"]}>
            <span><i /> 2026-27 // OVERRIDE</span>
            <span>V5RC</span>
          </div>
          <div className={styles["public-field-image"]}>
            <Image src="https://content.vexrobotics.com/docs/2026-2027/override/online-manual/assets/image/Iso.png" alt="Official VEX Override competition field" width={1100} height={760} priority />
          </div>
          <div className={styles["public-field-stats"]}>
            <div><strong>12 ft x 12 ft</strong><span>competition field</span></div>
            <div><strong>Live</strong><span>World Skills source</span></div>
            <div><strong>Official</strong><span>field reference</span></div>
          </div>
          <div className={styles["public-field-actions"]}>
            <span><Trophy aria-hidden="true" /> Competition-ready workspace</span>
            <a href="https://events.vex.com/robot-competitions/vex-robotics-competition/standings/skills" target="_blank" rel="noreferrer">World Skills <ExternalLink aria-hidden="true" /></a>
          </div>
        </aside>
      </section>

      <section className={styles["public-principles"]} id="standards">
        <div className={styles["public-principles-inner"]}>
          <div className={styles["public-section-label"]}>
            <p>Operating standard</p>
            <h2>Useful on the day a decision has to be made.</h2>
          </div>
          <div className={styles["public-principle-list"]}>
            <article className={styles["public-principle"]}><LockKeyhole aria-hidden="true" /><h3>Private by default</h3><p>Team spaces are not public profiles. Membership and roles determine access to private work.</p></article>
            <article className={styles["public-principle"]}><Database aria-hidden="true" /><h3>Clear data boundaries</h3><p>Unavailable event data is labelled unavailable. It is never replaced with invented standings.</p></article>
            <article className={styles["public-principle"]}><ShieldCheck aria-hidden="true" /><h3>Built for continuity</h3><p>Capture decisions, context, and progress so handoffs do not depend on who remembers the meeting.</p></article>
          </div>
        </div>
      </section>

      <section className={styles["public-process"]} id="getting-started">
        <div className={styles["public-process-header"]}>
          <h2>A deliberate start for a real workspace.</h2>
          <p>Create an account, complete onboarding, create or join a private team, then attach official competition information through the server-held integration when your deployment is configured for it.</p>
        </div>
        <div className={styles["public-steps"]} id="workflow">
          <article className={styles["public-step"]}><span className={styles["public-step-number"]}>01 / ACCOUNT</span><h3>Create your workspace account</h3><p>Every saved robot, team membership, and engineering artifact stays attached to a real account.</p></article>
          <article className={styles["public-step"]}><span className={styles["public-step-number"]}>02 / TEAM</span><h3>Create or join a private team</h3><p>Owners can create a team. Members can join only with a valid, scoped invitation.</p></article>
          <article className={styles["public-step"]}><span className={styles["public-step-number"]}>03 / EVIDENCE</span><h3>Use verified sources when available</h3><p>Connected event records remain explicitly sourced so teams know what is live, cached, or unavailable.</p></article>
        </div>
      </section>

      <section className={styles["public-cta"]}>
        <div><p>Ready when your team is</p><h2>Start with the team that will actually use the work.</h2></div>
        <div><Link className={`${styles["public-button"]} ${styles["public-button-primary"]}`} href="/register">Create account <ArrowRight aria-hidden="true" /></Link></div>
      </section>
      <PublicFooter />
    </main>
  );
}

export function LegalPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className={styles["public-site"]}>
      <PublicHeader />
      <article className={styles["public-legal"]}>
        <header className={styles["public-legal-header"]}>
          <p className={styles["public-eyebrow"]}>PitRelay policy</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <div className={styles["public-legal-content"]}>{children}</div>
      </article>
      <PublicFooter />
    </main>
  );
}
