import Image from "next/image";
import Link from "next/link";
import { JoinTeamForm } from "@/components/team/join-team-form";
import { requireCurrentUser } from "@/lib/authz";

export default async function JoinTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await requireCurrentUser("/join-team");
  const params = await searchParams;
  const initialCode = typeof params.code === "string" ? params.code.trim() : "";

  return (
    <main className="team-setup-page">
      <header className="team-setup-header">
        <Link className="team-setup-brand" href="/">
          <Image src="/pitrelay-mark.svg" alt="" width={40} height={40} />
          <span><strong>PitRelay</strong><small>Team workspace setup</small></span>
        </Link>
        <Link className="team-back-link" href="/team">Back to team workspace</Link>
      </header>
      <JoinTeamForm initialCode={initialCode} />
    </main>
  );
}
