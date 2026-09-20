"use client";

import { useActionState, useState } from "react";
import {
  regenerateTeamInviteAction,
  revokeTeamInvitesAction,
  type TeamActionState,
} from "@/lib/actions/team";
import { InlineSpinner } from "@/components/ui/loading-states";

type InviteManagerProps = {
  teamId: string;
  invite:
    | { active: true; currentUses: number; maxUses: number | null; expiresAt: Date | null }
    | { active: false };
};

const initialState: TeamActionState = {};

export function InviteManager({ teamId, invite }: InviteManagerProps) {
  const regenerateAction = regenerateTeamInviteAction.bind(null, teamId);
  const revokeAction = revokeTeamInvitesAction.bind(null, teamId);
  const [regenerateState, regenerateFormAction, regenerating] = useActionState(regenerateAction, initialState);
  const [revokeState, revokeFormAction, revoking] = useActionState(revokeAction, initialState);
  const [copied, setCopied] = useState<"code" | "link" | false>(false);
  const code = regenerateState.inviteCode;
  const joinLink = code && typeof window !== "undefined"
    ? `${window.location.origin}/join-team?code=${encodeURIComponent(code)}`
    : "";

  async function copyInviteCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied("code");
    } catch {
      setCopied(false);
    }
  }


  async function copyJoinLink() {
    if (!joinLink) return;
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied("link");
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="invite-manager">
      <div className="invite-manager-heading">
        <div>
          <p className="team-eyebrow">Private access</p>
          <h2>Member invite code</h2>
        </div>
        <span className={"invite-status" + (invite.active ? " is-active" : " is-inactive")}>
          {invite.active ? "Active" : "Disabled"}
        </span>
      </div>

      {invite.active ? (
        <p className="invite-status-detail">
          {invite.maxUses === null ? "No member limit" : `${invite.currentUses} of ${invite.maxUses} uses`}
          {invite.expiresAt ? ` · expires ${invite.expiresAt.toLocaleDateString()}` : " · no expiry"}
        </p>
      ) : (
        <p className="invite-status-detail">No active invitation can currently grant access to this workspace.</p>
      )}

      {code ? (
        <div className="invite-notice" aria-live="polite">
          <p className="team-eyebrow">Replacement invite code</p>
          <p>{regenerateState.success}</p>
          <div className="invite-code">
            <code>{code}</code>
            <button className="invite-copy" onClick={copyInviteCode} type="button">
              {copied === "code" ? "Copied" : "Copy code"}
            </button>
          </div>
          <div className="invite-link-row">
            <input aria-label="Team join link" readOnly value={joinLink} />
            <button className="invite-copy" onClick={copyJoinLink} type="button">
              {copied === "link" ? "Copied link" : "Copy join link"}
            </button>
          </div>
          <p className="invite-code-note">This is the only time this code can be displayed. The previous code is revoked. The join link contains the same private invite code.</p>
        </div>
      ) : null}

      <div className="invite-actions">
        <form action={regenerateFormAction} aria-busy={regenerating}>
          <button className="team-primary-action" disabled={regenerating || revoking} type="submit">
            {regenerating ? <InlineSpinner /> : null}{regenerating ? "Generating…" : invite.active ? "Replace invite code" : "Create invite code"}
          </button>
        </form>
        {invite.active ? (
          <form action={revokeFormAction} aria-busy={revoking}>
            <button className="team-danger-action" disabled={regenerating || revoking} type="submit">
              {revoking ? <InlineSpinner /> : null}{revoking ? "Disabling…" : "Disable code"}
            </button>
          </form>
        ) : null}
      </div>
      {regenerateState.error ? <p className="team-form-feedback is-error" role="alert">{regenerateState.error}</p> : null}
      {revokeState.error ? <p className="team-form-feedback is-error" role="alert">{revokeState.error}</p> : null}
      {revokeState.success ? <p className="team-form-feedback is-success" role="status">{revokeState.success}</p> : null}
    </section>
  );
}
