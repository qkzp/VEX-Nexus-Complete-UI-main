"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import {
  completeOnboardingAction,
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  type AuthActionState,
} from "@/lib/actions/auth";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";
import styles from "./auth-ui.module.css";

const EMPTY: AuthActionState = {};
type AvailabilityState =
  | { status: "idle"; message: string }
  | { status: "checking"; message: string }
  | { status: "available"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

function AuthFeedback({ error, success }: { error?: string; success?: string }) {
  return (
    <div className={styles["auth-feedback-slot"]} aria-live="polite">
      {error ? <p className={styles["auth-form-alert"]} role="alert">{error}</p> : null}
      {!error && success ? <p className={styles["auth-form-alert"]} data-variant="success">{success}</p> : null}
    </div>
  );
}

function PasswordInput({ id, name, autoComplete, placeholder }: { id: string; name: string; autoComplete: string; placeholder: string }) {
  const [visible, setVisible] = useState(false);
  return <div className={styles["auth-password-input"]}>
    <input suppressHydrationWarning id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={8} placeholder={placeholder} />
    <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>
      {visible ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
    </button>
  </div>;
}

export function LoginForm({ callbackUrl = "/app/dashboard", resetComplete = false }: { callbackUrl?: string; resetComplete?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, EMPTY);
  const formRef = useFormErrorFocus(state.error);

  return (
    <form ref={formRef} className={styles["auth-form"]} action={action} aria-busy={pending}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <AuthFeedback error={state.error} success={resetComplete ? "Password updated. Sign back in to continue." : undefined} />
      <div className={styles["auth-field"]}>
        <label htmlFor="login-identifier">Email or username</label>
        <input suppressHydrationWarning id="login-identifier" name="identifier" type="text" autoComplete="username" required placeholder="team@example.com or alex_rivera" />
      </div>
      <div className={styles["auth-field"]}>
        <label htmlFor="login-password">Password</label>
        <PasswordInput id="login-password" name="password" autoComplete="current-password" placeholder="Enter your password" />
      </div>
      <div className={styles["auth-inline-links"]}>
        <Link href={`/forgot-password`}>Forgot password?</Link>
        <Link href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}>Create account</Link>
      </div>
      <button suppressHydrationWarning className={styles["auth-submit"]} type="submit" disabled={pending} aria-disabled={pending}>
        {pending ? <InlineSpinner /> : <KeyRound aria-hidden="true" />} {pending ? "Signing in..." : "Sign in"} <ArrowRight aria-hidden="true" />
      </button>
      <p className={styles["auth-password-note"]}>
        <ShieldCheck aria-hidden="true" /> Team membership, robots, tasks, and event data stay attached to your real account.
      </p>
    </form>
  );
}

export function RegisterForm({ callbackUrl = "/onboarding" }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState(registerAction, EMPTY);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [emailStatus, setEmailStatus] = useState<AvailabilityState>({ status: "idle", message: "Use an inbox the team can still access." });
  const [usernameStatus, setUsernameStatus] = useState<AvailabilityState>({
    status: "idle",
    message: "Lowercase handle used across the workspace, like @alex_rivera.",
  });
  const availabilityCheckRef = useRef(0);
  const formRef = useFormErrorFocus(state.error);

  async function checkAvailability(kind: "email" | "username", value: string) {
    const trimmed = value.trim();
    const checkId = kind === "username" ? ++availabilityCheckRef.current : 0;
    if (!trimmed) {
      if (kind === "email") setEmailStatus({ status: "idle", message: "Use an inbox the team can still access." });
      if (kind === "username") {
        setUsernameStatus({ status: "idle", message: "Lowercase handle used across the workspace, like @alex_rivera." });
      }
      return;
    }

    if (kind === "username" && trimmed.length < 3) {
      setUsernameStatus({ status: "error", message: "Usernames need at least 3 letters or numbers." });
      return;
    }

    if (kind === "username") setUsernameStatus({ status: "checking", message: "Checking username availability..." });

    try {
      const params = new URLSearchParams();
      if (kind === "username") params.set("username", trimmed);

      const response = await fetch(`/api/auth/availability?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        emailAvailable?: boolean | null;
        usernameAvailable?: boolean | null;
        normalizedUsername?: string;
      };

      if (kind === "username" && checkId !== availabilityCheckRef.current) return;

      if (!response.ok || !payload.ok) {
        const message = payload.message || "Availability check is unavailable right now.";
        if (kind === "email") setEmailStatus({ status: "error", message });
        if (kind === "username") setUsernameStatus({ status: "error", message });
        return;
      }

      if (kind === "username") {
        setUsernameStatus(
          payload.usernameAvailable
            ? {
                status: "available",
                message: payload.normalizedUsername
                  ? `Username available. It will be saved as @${payload.normalizedUsername}.`
                  : "Username available.",
              }
            : { status: "unavailable", message: "That username is already taken." },
        );
      }
    } catch {
      if (kind === "username" && checkId !== availabilityCheckRef.current) return;
      const message = "Availability check is unavailable right now.";
      if (kind === "username") setUsernameStatus({ status: "error", message });
    }
  }

  return (
    <form ref={formRef} className={styles["auth-form"]} action={action} aria-busy={pending}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <AuthFeedback error={state.error} />
      <div className={styles["auth-identity-card"]}>
        <strong>Account identity</strong>
        <span>Choose the public handle teammates will recognize inside tasks, forum posts, and shared workspace activity.</span>
      </div>
      <div className={styles["auth-field-row"]}>
        <div className={styles["auth-field"]}>
          <label htmlFor="register-name">Full name</label>
          <input suppressHydrationWarning id="register-name" name="name" type="text" autoComplete="name" required minLength={2} placeholder="Alex Rivera" />
        </div>
        <div className={styles["auth-field"]}>
          <label htmlFor="register-username">Username</label>
          <input
            suppressHydrationWarning
            id="register-username"
            name="username"
            type="text"
            autoComplete="username"
            required
            placeholder="alex_rivera"
            value={username}
            minLength={3}
            aria-describedby="register-username-help"
            aria-invalid={usernameStatus.status === "unavailable" || usernameStatus.status === "error"}
            onChange={(event) => {
              setUsername(event.target.value);
              availabilityCheckRef.current += 1;
              setUsernameStatus({ status: "idle", message: "Lowercase handle used across the workspace, like @alex_rivera." });
            }}
            onBlur={(event) => void checkAvailability("username", event.target.value)}
          />
          <p id="register-username-help" className={styles["auth-help"]} data-status={usernameStatus.status}>{usernameStatus.message}</p>
        </div>
      </div>
      <div className={styles["auth-field"]}>
        <label htmlFor="register-email">Email</label>
        <input
          suppressHydrationWarning
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="team@example.com"
          value={email}
          aria-describedby="register-email-help"
          onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setEmailStatus({ status: "idle", message: "We only confirm account email details after a secure form submission." })}
        />
        <p id="register-email-help" className={styles["auth-help"]} data-status={emailStatus.status}>{emailStatus.message}</p>
      </div>
      <div className={styles["auth-field"]}>
        <label htmlFor="register-password">Password</label>
        <PasswordInput id="register-password" name="password" autoComplete="new-password" placeholder="At least 8 characters" />
        <p className={styles["auth-help"]}>Use at least 8 characters. Longer passphrases are better for shared team access.</p>
      </div>
      <div className={styles["auth-field"]}>
        <label htmlFor="register-confirm-password">Confirm password</label>
        <PasswordInput id="register-confirm-password" name="confirmPassword" autoComplete="new-password" placeholder="Repeat your password" />
      </div>
      <button suppressHydrationWarning className={styles["auth-submit"]} type="submit" disabled={pending} aria-disabled={pending}>
        {pending ? <InlineSpinner /> : <UserRound aria-hidden="true" />} {pending ? "Creating account..." : "Create account"} <ArrowRight aria-hidden="true" />
      </button>
      <p className={styles["auth-small-print"]}>
        Already have an account? <Link className={styles["auth-copy-link"]} href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}>Sign in</Link>.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, EMPTY);
  const formRef = useFormErrorFocus(state.error);
  return (
    <form ref={formRef} className={styles["auth-form"]} action={action} aria-busy={pending}>
      <AuthFeedback error={state.error} success={state.success} />
      <div className={styles["auth-field"]}>
        <label htmlFor="forgot-email">Email</label>
        <input suppressHydrationWarning id="forgot-email" name="email" type="email" autoComplete="email" required placeholder="team@example.com" />
        <p className={styles["auth-help"]}>We will email a secure password reset link if this account exists and mail delivery is configured.</p>
      </div>
      {state.resetUrl ? (
        <p className={styles["auth-password-note"]}>
          <ShieldCheck aria-hidden="true" /> Local reset link: <Link href={state.resetUrl}>{state.resetUrl}</Link>
        </p>
      ) : null}
      <button suppressHydrationWarning className={styles["auth-submit"]} type="submit" disabled={pending} aria-disabled={pending}>
        {pending ? <InlineSpinner /> : <KeyRound aria-hidden="true" />} {pending ? "Creating reset link..." : "Create reset link"} <ArrowRight aria-hidden="true" />
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, EMPTY);
  const formRef = useFormErrorFocus(state.error);
  if (!token) {
    return <p className={styles["auth-reset-missing"]}>That reset link is missing a token. Generate a new reset link and try again.</p>;
  }

  return (
    <form ref={formRef} className={styles["auth-form"]} action={action} aria-busy={pending}>
      <input type="hidden" name="token" value={token} />
      <AuthFeedback error={state.error} />
      <div className={styles["auth-field"]}>
        <label htmlFor="reset-password">New password</label>
        <PasswordInput id="reset-password" name="password" autoComplete="new-password" placeholder="At least 8 characters" />
        <p className={styles["auth-help"]}>Choose a new password for your PitRelay account.</p>
      </div>
      <div className={styles["auth-field"]}>
        <label htmlFor="reset-confirm-password">Confirm new password</label>
        <PasswordInput id="reset-confirm-password" name="confirmPassword" autoComplete="new-password" placeholder="Repeat your new password" />
      </div>
      <button suppressHydrationWarning className={styles["auth-submit"]} type="submit" disabled={pending} aria-disabled={pending}>
        {pending ? <InlineSpinner /> : <KeyRound aria-hidden="true" />} {pending ? "Updating password..." : "Update password"} <ArrowRight aria-hidden="true" />
      </button>
    </form>
  );
}

const EXPERIENCE_LEVELS = [
  ["JUST_STARTING", "Just starting"],
  ["FIRST_SEASON", "First season"],
  ["ONE_TO_TWO_SEASONS", "1-2 seasons"],
  ["THREE_PLUS_SEASONS", "3+ seasons"],
  ["MENTOR_COACH", "Mentor or coach"],
] as const;

const LANGUAGE_OPTIONS = [
  ["VEXCODE_PYTHON", "VEXCode Python"],
  ["VEXCODE_CPP", "VEXCode C++"],
  ["PROS_CPP", "PROS C++"],
  ["OTHER", "Other"],
] as const;

const ROLE_OPTIONS = [
  ["BUILDER", "Builder"],
  ["PROGRAMMER", "Programmer"],
  ["DRIVER", "Driver"],
  ["CAD", "CAD"],
  ["NOTEBOOK", "Notebook"],
  ["SCOUT", "Scout"],
  ["TEAM_LEAD", "Team lead"],
  ["MENTOR", "Mentor"],
] as const;

export function OnboardingForm({
  email,
  displayName,
  username,
  callbackUrl = "/app/dashboard",
}: {
  email: string;
  displayName: string;
  username: string;
  callbackUrl?: string;
}) {
  const [state, action, pending] = useActionState(completeOnboardingAction, EMPTY);
  const formRef = useFormErrorFocus(state.error);

  return (
    <form ref={formRef} className={styles["onboarding-form"]} action={action} aria-busy={pending}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className={styles["onboarding-account"]}>
        <span className={styles["onboarding-account-icon"]}><UserRound aria-hidden="true" /></span>
        <span>
          <strong>{displayName || email}</strong>
          <p>{email}</p>
        </span>
      </div>
      <AuthFeedback error={state.error} />
      <div className={styles["onboarding-field"]}>
        <label htmlFor="displayName">Display name</label>
        <input suppressHydrationWarning id="displayName" name="displayName" type="text" defaultValue={displayName} required />
        <p>This is the name shown in your team workspace and collaboration surfaces.</p>
      </div>
      <div className={styles["onboarding-field-grid"]}>
        <div className={styles["onboarding-field"]}>
          <label htmlFor="username">Username</label>
          <input suppressHydrationWarning id="username" name="username" type="text" autoComplete="username" defaultValue={username} required />
          <p>Used for mentions and identity labels like <code>@{username || "your_handle"}</code>.</p>
        </div>
        <div className={styles["onboarding-field"]}>
          <label htmlFor="teamNumber">Primary team number</label>
          <input suppressHydrationWarning id="teamNumber" name="teamNumber" type="text" placeholder="1234A" />
          <p>Optional. You can still create or join private teams later.</p>
        </div>
      </div>
      <div className={styles["onboarding-field-grid"]}>
        <div className={styles["onboarding-field"]}>
          <label htmlFor="experienceLevel">Experience level</label>
          <select suppressHydrationWarning id="experienceLevel" name="experienceLevel" defaultValue="">
            <option value="">Select one</option>
            {EXPERIENCE_LEVELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className={styles["onboarding-field"]}>
          <label htmlFor="preferredLanguage">Preferred programming language</label>
          <select suppressHydrationWarning id="preferredLanguage" name="preferredLanguage" defaultValue="">
            <option value="">Select one</option>
            {LANGUAGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <fieldset className={styles["onboarding-roles"]}>
        <legend className={styles["onboarding-role-legend"]}>What do you work on?</legend>
        <p>Pick the roles that match how you contribute to the robot and team operations.</p>
        <div className={styles["onboarding-role-grid"]}>
          {ROLE_OPTIONS.map(([value, label]) => (
            <label key={value} className={styles["onboarding-role"]}>
              <input suppressHydrationWarning type="checkbox" name="roles" value={value} defaultChecked={value === "PROGRAMMER"} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button suppressHydrationWarning className={styles["onboarding-submit"]} type="submit" disabled={pending} aria-disabled={pending}>
        {pending ? <InlineSpinner /> : <ArrowRight aria-hidden="true" />} {pending ? "Saving profile..." : "Finish setup"}
      </button>
      <p className={styles["onboarding-note"]}>You can edit your profile and team details again after entering the workspace.</p>
    </form>
  );
}
