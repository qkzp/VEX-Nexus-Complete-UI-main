import { StrategyCenter } from "@/components/app/strategy-center";
import { NeedsTeam } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function StrategyPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/strategy");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Join or create a team before scouting" />;
  const shared = await getTeamSharedState(team.id);
  return <StrategyCenter teamId={team.id} initialState={(shared.state.scouting ?? {}) as Record<string, unknown>} />;
}
