"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { joinTeamAction, type TeamActionState } from "@/lib/actions/team";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";

const initialState: TeamActionState = {};

export function JoinTeamForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(joinTeamAction, initialState);
  const formRef = useFormErrorFocus(state.error);

  useEffect(() => {
    if (!state.teamId) return;
    router.replace("/team?team=" + encodeURIComponent(state.teamId));
    router.refresh();
  }, [router, state.teamId]);

  return (
    <section className="team-setup-card team-join-card">
      <form ref={formRef} action={formAction} className="team-form" aria-busy={pending}>
        <div className="team-form-heading">
          <p className="team-eyebrow">Private invitation</p>
          <h1>Join a team workspace</h1>
          <p>Paste the complete invite code shared by a team owner or administrator.</p>
        </div>
        <label className="team-field">
          <span>Invite code</span>
          <input autoCapitalize="characters" autoComplete="off" defaultValue={initialCode} name="code" required spellCheck={false} />
        </label>
        {state.error ? <p className="team-form-feedback is-error" role="alert">{state.error}</p> : null}
        {state.success ? <p className="team-form-feedback is-success" role="status">{state.success}</p> : null}
        <button className="team-primary-action" disabled={pending} type="submit">
          {pending ? <InlineSpinner /> : null}{pending ? "Joining workspace…" : "Join workspace"}
        </button>
      </form>
    </section>
  );
}
