import Link from "next/link";
import { teamHref } from "@/lib/teams/workspace";

type Membership = {
  teamId: string;
  permission: string;
  team: {
    id: string;
    name: string;
    teamNumber: string | null;
    program: string;
  };
};

type TeamWorkspaceNavProps = {
  teamId: string;
  current: "overview" | "members" | "settings";
  memberships: Membership[];
};

const destinations = [
  { key: "overview", href: "/team", label: "Overview" },
  { key: "members", href: "/team/members", label: "Members" },
  { key: "settings", href: "/team/settings", label: "Settings" },
] as const;

export function TeamWorkspaceNav({ teamId, current, memberships }: TeamWorkspaceNavProps) {
  return (
    <nav className="team-workspace-nav" aria-label="Team workspace">
      <div className="team-workspace-nav-links">
        {destinations.map((destination) => (
          <Link
            className={"team-workspace-nav-link" + (destination.key === current ? " is-active" : "")}
            aria-current={destination.key === current ? "page" : undefined}
            href={teamHref(destination.href, teamId)}
            key={destination.key}
          >
            {destination.label}
          </Link>
        ))}
      </div>

      <div className="team-workspace-nav-tools">
        <Link className="team-workspace-return" href={teamHref("/app/dashboard", teamId)}>
          Back to workspace
        </Link>
        {memberships.length > 1 ? (
          <details className="team-switcher">
            <summary>Switch team</summary>
            <div className="team-switcher-list">
              {memberships.map((membership) => (
                <Link
                  className={membership.teamId === teamId ? "is-current" : undefined}
                  href={teamHref("/team", membership.teamId)}
                  key={membership.teamId}
                >
                  <span>{membership.team.teamNumber || membership.team.name}</span>
                  <small>{membership.team.name}</small>
                </Link>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </nav>
  );
}
