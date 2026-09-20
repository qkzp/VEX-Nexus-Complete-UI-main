import { CommandCenter } from "@/components/app/dashboard";
import { requireCompletedOnboarding } from "@/lib/authz";
import { getTeamDashboard, getWorkspaceTeam } from "@/lib/workspace/data";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/app/dashboard");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  const data = team ? await getTeamDashboard(team.id) : null;
  return <CommandCenter userName={user.name || user.username || "there"} team={team} data={data} />;
}
