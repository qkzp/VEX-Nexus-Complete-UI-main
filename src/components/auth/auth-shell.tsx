import Image from "next/image";
import Link from "next/link";
import { Database, ShieldCheck, Waypoints } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./auth-ui.module.css";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  prompt?: ReactNode;
};

export function AuthShell({ children, eyebrow, title, description, prompt }: AuthShellProps) {
  return (
    <main className={styles["auth-shell"]}>
      <aside className={styles["auth-aside"]} aria-label="PitRelay account access">
        <div className={styles["auth-grid"]} aria-hidden="true" />
        <Link className={styles["auth-brand"]} href="/" aria-label="PitRelay home">
          <Image className={styles["auth-brand-logo"]} src="/pitrelay-mark.svg" alt="" width={36} height={36} priority />
          <span>PITRELAY</span>
        </Link>

        <div className={styles["auth-aside-copy"]}>
          <Image className={styles["auth-hero-logo"]} src="/pitrelay-mark.svg" alt="PitRelay" width={440} height={440} priority />
          <p className={styles["auth-kicker"]}>Team engineering, held together</p>
          <h2>Keep the work behind your robot in one accountable place.</h2>
          <p>
            Private team spaces for builds, notebook evidence, competition research, and the decisions that move a season forward.
          </p>
          <div className={styles["auth-trust-list"]}>
            <div><ShieldCheck aria-hidden="true" /> Server-checked team accounts</div>
            <div><Database aria-hidden="true" /> Workspace data stored in Prisma</div>
            <div><Waypoints aria-hidden="true" /> Source-labelled competition data</div>
          </div>
        </div>

        <p className={styles["auth-aside-foot"]}>PITRELAY / COMPETITION OPERATIONS</p>
      </aside>

      <section className={styles["auth-main"]}>
        <div className={styles["auth-topbar"]}>{prompt}</div>
        <div className={styles["auth-content"]}>
          <header>
            <p className={styles["auth-kicker"]}>{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
