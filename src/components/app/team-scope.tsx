import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";
import type { WorkspaceTeam } from "@/lib/workspace/data";

export function TeamScope({ teams, selectedId, path }: { teams: WorkspaceTeam[]; selectedId: string; path: string }) {
  if (teams.length < 2) return null;
  return <nav className="team-scope" aria-label="Select a team workspace">
    {teams.map((team) => {
      const href = path + (path.includes("?") ? "&" : "?") + "team=" + encodeURIComponent(team.id);
      return <Link key={team.id} href={href} className={team.id === selectedId ? "is-active" : ""}>{team.teamNumber || team.name}</Link>;
    })}
  </nav>;
}

export function NeedsTeam({ title = "Create a team workspace first", body = "This area only shows private, persisted team data after you create or join a team." }: { title?: string; body?: string }) {
  return <section className="workspace-page needs-team">
    <UsersRound size={28} aria-hidden="true" />
    <div><span className="page-kicker">Private workspace</span><h1>{title}</h1><p>{body}</p><Link href="/onboarding/team" className="button button-primary">Set up a team <ArrowRight size={15} /></Link></div>
  </section>;
}
