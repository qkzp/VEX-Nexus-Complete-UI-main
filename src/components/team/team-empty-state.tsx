import Link from "next/link";

export function TeamEmptyState() {
  return (
    <main className="team-empty-state">
      <p className="team-eyebrow">Private team workspace</p>
      <h1>Set up your team workspace</h1>
      <p>
        Create a private VEX team workspace for your members, or join an existing workspace with an invite code.
      </p>
      <div className="team-empty-actions">
        <Link className="team-primary-action" href="/onboarding/team">
          Create a team
        </Link>
        <Link className="team-secondary-action" href="/join-team">
          Join with invite code
        </Link>
      </div>
    </main>
  );
}
