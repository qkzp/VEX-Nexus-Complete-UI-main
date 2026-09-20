"use client";

import { useActionState } from "react";
import { updateTeamSettingsAction, type TeamActionState } from "@/lib/actions/team";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";

type TeamSettingsFormProps = {
  team: {
    id: string;
    name: string;
    organization: string | null;
    location: string | null;
    eventRegion: string | null;
    description: string | null;
  };
};

export function TeamSettingsForm({ team }: TeamSettingsFormProps) {
  const action = updateTeamSettingsAction.bind(null, team.id);
  const [state, formAction, pending] = useActionState(action, {} as TeamActionState);
  const formRef = useFormErrorFocus(state.error);

  return (
    <form ref={formRef} action={formAction} className="team-form team-settings-form" aria-busy={pending}>
      <div className="team-form-grid">
        <label className="team-field">
          <span>Workspace name</span>
          <input defaultValue={team.name} maxLength={100} name="name" required />
        </label>
        <label className="team-field">
          <span>Organization</span>
          <input defaultValue={team.organization ?? ""} maxLength={160} name="organization" />
        </label>
        <label className="team-field">
          <span>Location</span>
          <input defaultValue={team.location ?? ""} maxLength={160} name="location" />
        </label>
        <label className="team-field">
          <span>Event region</span>
          <input defaultValue={team.eventRegion ?? ""} maxLength={160} name="eventRegion" />
        </label>
      </div>
      <label className="team-field">
        <span>Private team description</span>
        <textarea defaultValue={team.description ?? ""} maxLength={4000} name="description" rows={5} />
      </label>
      <div className="team-settings-actions">
        {state.error ? <p className="team-form-feedback is-error" role="alert">{state.error}</p> : null}
        {state.success ? <p className="team-form-feedback is-success" role="status">{state.success}</p> : null}
        <button className="team-primary-action" disabled={pending} type="submit">
          {pending ? <InlineSpinner /> : null}{pending ? "Saving settings…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
