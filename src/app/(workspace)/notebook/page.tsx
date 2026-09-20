import { NotebookStudio } from "@/components/app/notebook-studio";
import { NeedsTeam } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getTeamSharedState } from "@/lib/workspace/state";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function NotebookPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/notebook");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Join or create a team before connecting a notebook" />;
  const shared = await getTeamSharedState(team.id);
  return <NotebookStudio teamId={team.id} initialState={(shared.state.notebook ?? {}) as Record<string, unknown>} />;
}
