import { SkillsStandings } from "@/components/app/skills-standings";
import { requireCompletedOnboarding } from "@/lib/authz";
import { getWorkspaceTeam } from "@/lib/workspace/data";
import { getVexTeamSkills, lookupVexTeams, type VexEventsSkillsRecord, type VexEventsTeam } from "@/lib/services/vex-events";
import { VEX_OVERRIDE } from "@/lib/vex-official";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function RankingsPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/rankings");
  const { team } = await getWorkspaceTeam(user.id, requestedTeam);
  const teamNumber = team?.teamNumber ?? "";
  let officialTeam: VexEventsTeam | null = null;
  let skills: VexEventsSkillsRecord[] = [];
  let sourceFetchedAt = "";
  let message = "";

  if (teamNumber) {
    const teamResult = await lookupVexTeams(teamNumber);
    if (teamResult.status === "ok") {
      officialTeam = teamResult.data.teams.find((candidate) => candidate.number.toUpperCase() === teamNumber.toUpperCase()) ?? teamResult.data.teams[0] ?? null;
      if (officialTeam) {
        const skillsResult = await getVexTeamSkills(officialTeam.id, VEX_OVERRIDE.seasonId);
        if (skillsResult.status === "ok") {
          skills = skillsResult.data.skills;
          sourceFetchedAt = skillsResult.source.fetchedAt;
        } else message = skillsResult.message;
      } else message = "VEX Events did not return this team number.";
    } else message = teamResult.message;
  }

  return <SkillsStandings teamNumber={teamNumber} team={officialTeam} skills={skills} sourceFetchedAt={sourceFetchedAt} message={message} />;
}
