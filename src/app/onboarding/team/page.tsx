import Image from "next/image";
import Link from "next/link";
import { CreateTeamForm } from "@/components/team/create-team-form";
import { getTeamWorkspace, teamHref } from "@/lib/teams/workspace";

export default async function TeamOnboardingPage() {
  const { memberships, workspace } = await getTeamWorkspace(undefined, "/onboarding/team");
  if (workspace) {
    return (
      <main className="team-setup-page">
        <section className="team-setup-card team-existing-workspace">
          <p className="team-eyebrow">Team setup complete</p>
          <h1>You already have a private team workspace.</h1>
          <p>Open it to manage members, private invite codes, and workspace details.</p>
          <Link className="team-primary-action" href={teamHref("/team", workspace.team.id)}>Open {workspace.team.name}</Link>
          {memberships.length > 1 ? <Link className="team-secondary-action" href="/team">View all teams</Link> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="team-setup-page">
      <header className="team-setup-header">
        <Link className="team-setup-brand" href="/">
          <Image src="/boltcanvas-mark.svg" alt="" width={40} height={40} />
          <span><strong>BoltCanvas</strong><small>Team workspace setup</small></span>
        </Link>
        <Link className="team-back-link" href="/join-team">I already have an invite code</Link>
      </header>
      <CreateTeamForm />
    </main>
  );
}
