import Link from "next/link";
import { InviteManager } from "@/components/team/invite-manager";
import { TeamEmptyState } from "@/components/team/team-empty-state";
import { TeamSettingsForm } from "@/components/team/team-settings-form";
import { TeamWorkspaceNav } from "@/components/team/team-workspace-nav";
import { getTeamWorkspace, teamHref } from "@/lib/teams/workspace";

type PageProps = { searchParams: Promise<{ team?: string | string[] }> };

export default async function TeamSettingsPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const { memberships, workspace } = await getTeamWorkspace(requestedTeam, "/team/settings");
  if (!workspace) return <TeamEmptyState />;

  const { team, membership, invite } = workspace;
  const canManage = membership.permission === "OWNER" || membership.permission === "ADMIN";

  return (
    <main className="team-page team-settings-page">
      <header className="team-header">
        <div>
          <p className="team-eyebrow">Private workspace</p>
          <h1>Team settings</h1>
          <p className="team-header-detail">
            Update the information your signed-in team members use to identify this workspace.
          </p>
        </div>
        <div className="team-header-actions">
          <Link className="team-secondary-action" href={teamHref("/app/dashboard", team.id)}>
            Back to workspace
          </Link>
        </div>
      </header>

      <TeamWorkspaceNav current="settings" memberships={memberships} teamId={team.id} />

      {canManage ? (
        <div className="team-settings-grid">
          <section className="team-card team-settings-card">
            <div className="team-card-heading">
              <div>
                <p className="team-eyebrow">Workspace profile</p>
                <h2>Team details</h2>
              </div>
            </div>
            <TeamSettingsForm team={team} />
          </section>
          <InviteManager invite={invite} teamId={team.id} />
        </div>
      ) : (
        <section className="team-card team-restricted-card">
          <p className="team-eyebrow">Restricted</p>
          <h2>Settings are managed by the team owner or an administrator.</h2>
          <p>You can still see team details and member roles from the workspace overview.</p>
        </section>
      )}
    </main>
  );
}
