import { redirect } from "next/navigation";
import { requireCompletedOnboarding } from "@/lib/authz";
import { databaseErrorMessage } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { WorkspaceShell } from "@/components/app/workspace-shell";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCompletedOnboarding();
  let teams;
  let team;

  try {
    ({ teams, team } = await getWorkspaceTeam(user.id));
  } catch (error) {
    const databaseMessage = databaseErrorMessage(error);
    if (databaseMessage) {
      redirect("/login?database=offline");
    }
    throw error;
  }

  return (
    <WorkspaceShell
      teams={teams}
      activeTeamId={team?.id ?? null}
      currentUser={{ name: user.name ?? null, email: user.email ?? null }}
    >
      {children}
    </WorkspaceShell>
  );
}
