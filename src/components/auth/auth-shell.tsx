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
      <aside className={styles["auth-aside"]} aria-label="BoltCanvas account access">
        <div className={styles["auth-grid"]} aria-hidden="true" />
        <Link className={styles["auth-brand"]} href="/" aria-label="BoltCanvas home">
          <Image className={styles["auth-brand-logo"]} src="/boltcanvas-mark.svg" alt="" width={36} height={36} priority />
          <span>BOLTCANVAS</span>
        </Link>

        <div className={styles["auth-aside-copy"]}>
          <Image className={styles["auth-hero-logo"]} src="/boltcanvas-mark.svg" alt="BoltCanvas" width={440} height={440} priority />
          <p className={styles["auth-kicker"]}>Team engineering, held together</p>
          <h2>Less time organizing. More time building.</h2>
          <p>
            Your VEX V5 team’s home for robot setup, autonomous routes, testing, and the engineering notebook. Keep everyone ready for the next match.
          </p>
          <div className={styles["auth-trust-list"]}>
            <div><ShieldCheck aria-hidden="true" /> Private workspaces for your team</div>
            <div><Database aria-hidden="true" /> Shared robot configurations and test notes</div>
            <div><Waypoints aria-hidden="true" /> Plan autonomous. Export VEXcode.</div>
          </div>
        </div>

        <p className={styles["auth-aside-foot"]}>BOLTCANVAS / COMPETITION OPERATIONS</p>
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
