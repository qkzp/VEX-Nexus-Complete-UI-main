import Link from "next/link";
import { TeamEmptyState } from "@/components/team/team-empty-state";
import { TeamWorkspaceNav } from "@/components/team/team-workspace-nav";
import { getTeamWorkspace, teamHref } from "@/lib/teams/workspace";

type PageProps = { searchParams: Promise<{ team?: string | string[] }> };

function permissionLabel(permission: string) {
  return permission === "TEAM_LEAD" ? "Team lead" : permission.charAt(0) + permission.slice(1).toLowerCase();
}

export default async function TeamPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const { memberships, workspace } = await getTeamWorkspace(requestedTeam, "/team");
  if (!workspace) return <TeamEmptyState />;

  const { team, membership, members, invite } = workspace;
  const manageMembers = membership.permission === "OWNER" || membership.permission === "ADMIN";

  return (
    <main className="team-page">
      <header className="team-header">
        <div>
          <p className="team-eyebrow">Private team workspace</p>
          <h1>{team.name}</h1>
          <p className="team-header-detail">
            {team.teamNumber ? `${team.program} / ${team.teamNumber}` : team.program}
            {team.organization ? ` / ${team.organization}` : ""}
          </p>
        </div>
        <div className="team-header-actions">
          <span className="team-permission-badge">{permissionLabel(membership.permission)}</span>
          <Link className="team-secondary-action" href={teamHref("/app/dashboard", team.id)}>
            Back to workspace
          </Link>
          <Link className="team-secondary-action" href="/join-team">
            Join another team
          </Link>
        </div>
      </header>

      <TeamWorkspaceNav current="overview" memberships={memberships} teamId={team.id} />

      <section className="team-overview-grid">
        <article className="team-card team-summary-card">
          <p className="team-eyebrow">Workspace</p>
          <h2>Team snapshot</h2>
          <dl className="team-facts">
            <div>
              <dt>Program</dt>
              <dd>{team.program}</dd>
            </div>
            <div>
              <dt>Team number</dt>
              <dd>{team.teamNumber || "Not set"}</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>{team.eventRegion || "Not set"}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{team.location || "Not set"}</dd>
            </div>
          </dl>
          {team.description ? (
            <p className="team-description">{team.description}</p>
          ) : (
            <p className="team-muted-copy">Add a private team description from settings when you are ready.</p>
          )}
        </article>

        <article className="team-card team-member-summary">
          <p className="team-eyebrow">Members</p>
          <strong className="team-stat-value">{members.length}</strong>
          <p>{members.length === 1 ? "active member" : "active members"}</p>
          <Link href={teamHref("/team/members", team.id)}>View member access</Link>
        </article>

        <article className="team-card team-invite-summary">
          <p className="team-eyebrow">Invite status</p>
          <strong>{invite.active ? "Active" : "Disabled"}</strong>
          <p>
            {invite.active
              ? invite.maxUses === null
                ? "Ready for members"
                : `${invite.currentUses} of ${invite.maxUses} uses`
              : "No code can grant access"}
          </p>
          {manageMembers ? <Link href={teamHref("/team/settings", team.id)}>Manage invite code</Link> : null}
        </article>
      </section>

      <section className="team-card team-member-preview">
        <div className="team-card-heading">
          <div>
            <p className="team-eyebrow">People</p>
            <h2>Current members</h2>
          </div>
          <Link className="team-secondary-action" href={teamHref("/team/members", team.id)}>
            Manage members
          </Link>
        </div>
        <ul className="team-member-preview-list">
          {members.slice(0, 6).map((member) => (
            <li key={member.id}>
              <span className="team-member-avatar" aria-hidden="true">
                {member.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span>
                <b>{member.displayName}</b>
                <small>{permissionLabel(member.permission)}</small>
              </span>
              {member.roboticsRoles.length ? (
                <em>{member.roboticsRoles.map((role) => role.replace("_", " ")).join(" / ")}</em>
              ) : (
                <em>No robotics roles set</em>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
