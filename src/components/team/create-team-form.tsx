"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createTeamAction, type TeamActionState } from "@/lib/actions/team";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";

const initialState: TeamActionState = {};

export function CreateTeamForm({ defaultTeamNumber = "" }: { defaultTeamNumber?: string }) {
  const [state, formAction, pending] = useActionState(createTeamAction, initialState);
  const [copied, setCopied] = useState(false);
  const formRef = useFormErrorFocus(state.error);

  async function copyInviteCode() {
    if (!state.inviteCode) return;
    try {
      await navigator.clipboard.writeText(state.inviteCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="team-setup-card">
      <form ref={formRef} action={formAction} className="team-form" aria-busy={pending}>
        <div className="team-form-heading">
          <p className="team-eyebrow">Team setup</p>
          <h1>Create a private workspace</h1>
          <p>Create a blank V5RC team workspace for your PitRelay account. Team data stays scoped to members you invite.</p>
        </div>

        <div className="team-form-grid">
          <label className="team-field">
            <span>Team number</span>
            <input autoComplete="off" defaultValue={defaultTeamNumber} maxLength={16} name="teamNumber" required />
          </label>
          <label className="team-field">
            <span>Program</span>
            <select defaultValue="V5RC" name="program" disabled>
              <option value="V5RC">V5RC</option>
            </select>
            <input type="hidden" name="program" value="V5RC" />
          </label>
        </div>

        <label className="team-field">
          <span>Workspace name</span>
          <input maxLength={100} name="name" required />
        </label>

        {state.error ? <p className="team-form-feedback is-error" role="alert">{state.error}</p> : null}
        <button className="team-primary-action" disabled={pending} type="submit">
          {pending ? <InlineSpinner /> : null}{pending ? "Creating workspace…" : "Create workspace"}
        </button>
      </form>

      {state.inviteCode && state.teamId ? (
        <section className="invite-notice" aria-live="polite">
          <p className="team-eyebrow">New invite code</p>
          <h2>Save this code now</h2>
          <p>{state.success}</p>
          <div className="invite-code">
            <code>{state.inviteCode}</code>
            <button className="invite-copy" onClick={copyInviteCode} type="button">
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <p className="invite-code-note">For security, the code is not stored in readable form and cannot be shown again.</p>
          <Link className="team-secondary-action" href={"/team?team=" + encodeURIComponent(state.teamId)}>
            Open team workspace
          </Link>
        </section>
      ) : null}
    </div>
  );
}
