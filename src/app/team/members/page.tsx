import Link from "next/link";
import { TeamEmptyState } from "@/components/team/team-empty-state";
import { TeamMemberAccessForm } from "@/components/team/team-member-access-form";
import { TeamWorkspaceNav } from "@/components/team/team-workspace-nav";
import { getTeamWorkspace, teamHref } from "@/lib/teams/workspace";

type PageProps = { searchParams: Promise<{ team?: string | string[] }> };

function permissionLabel(permission: string) {
  return permission === "TEAM_LEAD" ? "Team lead" : permission.charAt(0) + permission.slice(1).toLowerCase();
}

export default async function TeamMembersPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const { user, memberships, workspace } = await getTeamWorkspace(requestedTeam, "/team/members");
  if (!workspace) return <TeamEmptyState />;

  const { team, membership, members } = workspace;
  const canManage = membership.permission === "OWNER" || membership.permission === "ADMIN";

  return (
    <main className="team-page team-members-page">
      <header className="team-header">
        <div>
          <p className="team-eyebrow">Private access</p>
          <h1>Team members</h1>
          <p className="team-header-detail">Manage access for {team.name}. Changes are recorded in the team audit trail.</p>
        </div>
        <div className="team-header-actions">
          <Link className="team-secondary-action" href={teamHref("/app/dashboard", team.id)}>
            Back to workspace
          </Link>
        </div>
      </header>

      <TeamWorkspaceNav current="members" memberships={memberships} teamId={team.id} />

      <section className="team-members-list" aria-label="Team members">
        {members.map((member) => {
          const adminCannotEdit = membership.permission === "ADMIN" && member.permission === "ADMIN";
          const canEditMember = canManage && member.permission !== "OWNER" && !adminCannotEdit && member.userId !== user.id;

          return (
            <article className="team-member-card" key={member.id}>
              <div className="team-member-identity">
                <span className="team-member-avatar" aria-hidden="true">
                  {member.displayName.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <h2>{member.displayName}</h2>
                  <p>
                    {permissionLabel(member.permission)}
                    {member.userId === user.id ? " / You" : ""}
                  </p>
                </div>
              </div>
              <div className="team-member-roles">
                {member.roboticsRoles.length ? (
                  member.roboticsRoles.map((role) => <span key={role}>{role.replace("_", " ")}</span>)
                ) : (
                  <span className="is-empty">No robotics roles</span>
                )}
              </div>
              {canEditMember && member.permission !== "OWNER" ? (
                <TeamMemberAccessForm
                  actorPermission={membership.permission}
                  memberId={member.id}
                  permission={member.permission}
                  roboticsRoles={member.roboticsRoles}
                  teamId={team.id}
                />
              ) : (
                <p className="team-member-access-note">
                  {member.permission === "OWNER"
                    ? "Ownership access is protected."
                    : member.userId === user.id
                      ? "You can view your current access here."
                      : adminCannotEdit
                        ? "Only the team owner can manage administrator access."
                        : "You can view this member's access."}
                </p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
