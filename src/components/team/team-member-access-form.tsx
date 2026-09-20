"use client";

import { useActionState } from "react";
import { updateTeamMemberAccessAction, type TeamActionState } from "@/lib/actions/team";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";

type Permission = "OWNER" | "ADMIN" | "TEAM_LEAD" | "MEMBER" | "VIEWER";
type RoboticsRole = "BUILDER" | "PROGRAMMER" | "DRIVER" | "CAD" | "NOTEBOOK" | "SCOUT" | "TEAM_LEAD" | "MENTOR";

type TeamMemberAccessFormProps = {
  teamId: string;
  memberId: string;
  permission: Exclude<Permission, "OWNER">;
  roboticsRoles: RoboticsRole[];
  actorPermission: Permission;
};

const roleOptions: { value: RoboticsRole; label: string }[] = [
  { value: "BUILDER", label: "Builder" },
  { value: "PROGRAMMER", label: "Programmer" },
  { value: "DRIVER", label: "Driver" },
  { value: "CAD", label: "CAD" },
  { value: "NOTEBOOK", label: "Notebook" },
  { value: "SCOUT", label: "Scout" },
  { value: "TEAM_LEAD", label: "Team lead" },
  { value: "MENTOR", label: "Mentor" },
];

function permissionOptions(actorPermission: Permission) {
  return actorPermission === "OWNER"
    ? ["ADMIN", "TEAM_LEAD", "MEMBER", "VIEWER"] as const
    : ["TEAM_LEAD", "MEMBER", "VIEWER"] as const;
}

function labelPermission(permission: Permission) {
  return permission === "TEAM_LEAD" ? "Team lead" : permission.charAt(0) + permission.slice(1).toLowerCase();
}

export function TeamMemberAccessForm({
  teamId,
  memberId,
  permission,
  roboticsRoles,
  actorPermission,
}: TeamMemberAccessFormProps) {
  const action = updateTeamMemberAccessAction.bind(null, teamId, memberId);
  const [state, formAction, pending] = useActionState(action, {} as TeamActionState);
  const formRef = useFormErrorFocus(state.error);

  return (
    <form ref={formRef} action={formAction} className="team-permission-form" aria-busy={pending}>
      <label className="team-field">
        <span>Workspace permission</span>
        <select defaultValue={permission} name="permission">
          {permissionOptions(actorPermission).map((option) => (
            <option key={option} value={option}>{labelPermission(option)}</option>
          ))}
        </select>
      </label>

      <fieldset className="team-roles">
        <legend>Robotics roles</legend>
        <div className="team-roles-list">
          {roleOptions.map((role) => (
            <label className="team-role-option" key={role.value}>
              <input defaultChecked={roboticsRoles.includes(role.value)} name="roboticsRoles" type="checkbox" value={role.value} />
              <span>{role.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="team-permission-actions">
        {state.error ? <p className="team-form-feedback is-error" role="alert">{state.error}</p> : null}
        {state.success ? <p className="team-form-feedback is-success" role="status">{state.success}</p> : null}
        <button className="team-secondary-action" disabled={pending} type="submit">
          {pending ? <InlineSpinner /> : null}{pending ? "Saving…" : "Save access"}
        </button>
      </div>
    </form>
  );
}
