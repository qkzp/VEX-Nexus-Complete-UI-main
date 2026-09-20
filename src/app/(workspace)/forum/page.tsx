import { MessageSquareText } from "lucide-react";
import { ForumBoard } from "@/components/app/forum-board";
import { TeamScope } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { getForumPageData } from "@/lib/forum/service";
import { getWorkspaceTeam } from "@/lib/workspace/data";

type PageProps = {
  searchParams: Promise<{
    category?: string;
    q?: string;
    team?: string;
    thread?: string;
  }>;
};

export default async function ForumPage({ searchParams }: PageProps) {
  const { category, q, team: requestedTeam, thread } = await searchParams;
  const user = await requireCompletedOnboarding("/forum");
  const [{ team, teams }, forum] = await Promise.all([
    getWorkspaceTeam(user.id, requestedTeam),
    getForumPageData({ categorySlug: category, searchQuery: q, threadSlug: thread }),
  ]);

  const scopeParams = new URLSearchParams();
  if (category) scopeParams.set("category", category);
  if (q) scopeParams.set("q", q);
  if (thread) scopeParams.set("thread", thread);
  const scopePath = scopeParams.toString() ? `/forum?${scopeParams.toString()}` : "/forum";

  return (
    <section className="workspace-page suite-page">
      <header className="suite-hero compact">
        <div>
          <div className="suite-badges">
            <span className="analysis-badge">PUBLIC COMMUNITY DISCUSSIONS</span>
            <span className="status-chip neutral">
              {team ? `Posting context: ${team.teamNumber || team.name}` : "Posting context: account only"}
            </span>
          </div>
          <p className="page-kicker">Community Forum</p>
          <h1>Let teams help each other without mixing public advice with private workspace data.</h1>
          <p>
            Use this area for cross-team questions, explanations, guides, and useful resources. Team-scoped tasks,
            notebook entries, and build logs remain private unless you intentionally post them here.
          </p>
        </div>
        <MessageSquareText size={28} />
      </header>

      {teams.length > 1 ? <TeamScope teams={teams} selectedId={team?.id ?? teams[0]!.id} path={scopePath} /> : null}

      <ForumBoard
        categories={forum.categories}
        searchQuery={forum.searchQuery}
        selectedCategory={forum.selectedCategory}
        selectedTeamId={team?.id ?? null}
        selectedThread={forum.selectedThread}
        teams={teams}
        threads={forum.threads}
      />
    </section>
  );
}
