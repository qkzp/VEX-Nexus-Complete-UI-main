"use client";

import { useActionState } from "react";
import { ArrowRight, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";
import { enterDevModeAction, resetDemoDataAction, type DevGateState } from "@/lib/actions/dev";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";
import styles from "./auth-ui.module.css";

const EMPTY: DevGateState = {};
export function DevGateForm({
  callbackUrl = "/app/dashboard",
  resetComplete = false,
}: {
  callbackUrl?: string;
  resetComplete?: boolean;
}) {
  const [state, action, pending] = useActionState(enterDevModeAction, EMPTY);
  const formRef = useFormErrorFocus(state.error);

  return (
    <form ref={formRef} className={styles["auth-form"]} action={action} aria-busy={pending}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {resetComplete ? (
        <p className={styles["auth-form-alert"]} data-variant="success">
          Demo data cleared. Enter the DEV key to open a fresh workspace.
        </p>
      ) : null}
      {state.error ? (
        <p className={styles["auth-form-alert"]} role="alert">
          {state.error}
        </p>
      ) : null}
      <div className={styles["auth-field"]}>
        <label htmlFor="devKey">DEV access key</label>
        <input
          suppressHydrationWarning
          id="devKey"
          name="devKey"
          type="password"
          autoComplete="off"
          required
          placeholder="Configured local key"
        />
        <p className={styles["auth-help"]}>
          Local demo access only. This is available only when the server explicitly enables local developer tools.
        </p>
      </div>
      <button suppressHydrationWarning className={styles["auth-submit"]} type="submit" disabled={pending}>
        {pending ? <InlineSpinner /> : <KeyRound aria-hidden="true" />} {pending ? "Opening demo..." : "Open demo workspace"}{" "}
        <ArrowRight aria-hidden="true" />
      </button>
      <p className={styles["auth-password-note"]}>
        <ShieldCheck aria-hidden="true" /> The key is checked on the server and is never stored in browser workspace
        data.
      </p>
    </form>
  );
}

export function ResetDemoForm() {
  const [state, action, pending] = useActionState(resetDemoDataAction, EMPTY);
  const formRef = useFormErrorFocus(state.error);

  return (
    <form ref={formRef} className={`${styles["auth-form"]} ${styles["dev-reset-form"]}`} action={action} aria-busy={pending}>
      {state.error ? (
        <p className={styles["auth-form-alert"]} role="alert">
          {state.error}
        </p>
      ) : null}
      <div className={styles["auth-field"]}>
        <label htmlFor="resetDevKey">DEV access key</label>
        <input
          suppressHydrationWarning
          id="resetDevKey"
          name="devKey"
          type="password"
          autoComplete="off"
          required
          placeholder="Configured local key"
        />
        <p className={styles["auth-help"]}>
          Re-enter the configured local key to clear the local demo workspace.
        </p>
      </div>
      <button suppressHydrationWarning className={styles["auth-danger-submit"]} type="submit" disabled={pending}>
        {pending ? <InlineSpinner /> : <RotateCcw aria-hidden="true" />} {pending ? "Resetting..." : "Erase all demo workspace data"}
      </button>
      <p className={styles["auth-help"]}>
        This deletes demo teams, robots, scouting, testing, notebook links, tasks, code projects, and the synthetic
        DEV user. Official VEX source files in the project are not changed.
      </p>
    </form>
  );
}
