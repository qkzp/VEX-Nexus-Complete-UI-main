import { ClipboardCheck, Plus } from "lucide-react";
import { CreateTaskForm } from "@/components/app/workspace-forms";
import { TaskQueue } from "@/components/app/task-queue";
import { NeedsTeam, TeamScope } from "@/components/app/team-scope";
import { requireCompletedOnboarding } from "@/lib/authz";
import { prisma, withDatabaseFallback } from "@/lib/db";
import { getWorkspaceTeam } from "@/lib/workspace/data";

type PageProps = { searchParams: Promise<{ team?: string }> };

export default async function TeamTasksPage({ searchParams }: PageProps) {
  const { team: requestedTeam } = await searchParams;
  const user = await requireCompletedOnboarding("/team/tasks");
  const { team, teams } = await getWorkspaceTeam(user.id, requestedTeam);
  if (!team) return <NeedsTeam title="Create or join a team first" body="Tasks belong to a shared team workspace." />;

  const [tasks, members, robots] = await withDatabaseFallback(
    () =>
      Promise.all([
        prisma.task.findMany({
          where: { teamId: team.id, status: { not: "CANCELLED" } },
          orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }, { updatedAt: "desc" }],
          include: {
            robot: { select: { id: true, name: true } },
            assignees: { include: { user: { select: { id: true, displayName: true, name: true, username: true } } } },
          },
        }),
        prisma.teamMember.findMany({
          where: { teamId: team.id, status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, displayName: true, name: true, username: true, email: true } } },
        }),
        prisma.robot.findMany({ where: { teamId: team.id, status: { notIn: ["ARCHIVED", "RETIRED"] } }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true } }),
      ]),
    [[], [], []],
  );

  const memberOptions = members.map((member) => ({
    id: member.user.id,
    label: member.user.displayName || member.user.name || member.user.username || member.user.email || "Team member",
  }));

  return <section className="workspace-page suite-page">
    <header className="suite-hero compact"><div><p className="page-kicker">Team workspace / Tasks</p><h1>Make the next move clear.</h1><p>Assign work, find what matters, and keep the team moving.</p></div><ClipboardCheck size={28} aria-hidden="true" /></header>
    <TeamScope teams={teams} selectedId={team.id} path="/team/tasks" />
    <details className="suite-panel task-composer" open={!tasks.length}><summary><Plus size={18} aria-hidden="true" /><strong>New task</strong><span>Give the next step an owner</span></summary><CreateTaskForm teamId={team.id} members={memberOptions} robots={robots}/></details>
    <TaskQueue key={team.id} members={memberOptions} tasks={tasks.map((task) => ({
      id: task.id, title: task.title, description: task.description, status: task.status, priority: task.priority,
      robotName: task.robot?.name ?? null, dueAt: task.dueAt?.toISOString() ?? null,
      assignees: task.assignees.map(({ user: assignee }) => ({ id: assignee.id, name: assignee.displayName || assignee.name || assignee.username || "Member" })),
    }))} />
  </section>;
}
