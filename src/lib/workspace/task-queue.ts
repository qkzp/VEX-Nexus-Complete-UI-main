export type QueueTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  robotName: string | null;
  dueAt: string | null;
  assignees: { id: string; name: string }[];
};

export type QueueFilter = "open" | "all" | "urgent" | "unassigned" | "complete";

const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function filterTaskQueue(tasks: QueueTask[], query: string, filter: QueueFilter, memberId = "") {
  const term = query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (task.status === "CANCELLED") return false;
    const complete = task.status === "COMPLETE";
    if (filter === "open" && complete) return false;
    if (filter === "complete" && !complete) return false;
    if (filter === "urgent" && (complete || !["HIGH", "CRITICAL"].includes(task.priority))) return false;
    if (filter === "unassigned" && (complete || task.assignees.length > 0)) return false;
    if (memberId && !task.assignees.some((assignee) => assignee.id === memberId)) return false;
    return !term || [task.title, task.description, task.robotName, ...task.assignees.map((assignee) => assignee.name)].filter(Boolean).join(" ").toLowerCase().includes(term);
  }).sort((a, b) => {
    const completed = Number(a.status === "COMPLETE") - Number(b.status === "COMPLETE");
    const priority = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    const due = (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity);
    return completed || priority || (Number.isNaN(due) ? 0 : due) || a.title.localeCompare(b.title);
  });
}
