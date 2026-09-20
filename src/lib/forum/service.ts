import type { ForumThreadStatus, ForumThreadType } from "@prisma/client";
import { prisma } from "@/lib/db";

const PUBLIC_THREAD_STATUSES: ForumThreadStatus[] = ["OPEN", "LOCKED", "ARCHIVED"];

const DEFAULT_FORUM_CATEGORIES = [
  {
    slug: "help-desk",
    name: "Help Desk",
    description: "Ask questions about build issues, code bugs, sensors, wiring, or match problems.",
    sortOrder: 10,
  },
  {
    slug: "programming",
    name: "Programming",
    description: "Share autonomous ideas, control logic, debugging notes, and VEX coding patterns.",
    sortOrder: 20,
  },
  {
    slug: "mechanical",
    name: "Mechanical",
    description: "Talk about drivetrains, intakes, lifts, game mechanisms, reliability, and packaging.",
    sortOrder: 30,
  },
  {
    slug: "strategy-and-scouting",
    name: "Strategy and Scouting",
    description: "Discuss match plans, scouting workflows, event prep, and practice structure.",
    sortOrder: 40,
  },
  {
    slug: "resources-and-showcase",
    name: "Resources and Showcase",
    description: "Post guides, templates, reference links, and examples your team found useful.",
    sortOrder: 50,
  },
] as const;

type ForumQuery = {
  categorySlug?: string | null;
  searchQuery?: string | null;
  threadSlug?: string | null;
};

type UserIdentity = {
  displayName: string | null;
  name: string | null;
  username: string | null;
};

type TeamIdentity = {
  id: string;
  name: string;
  teamNumber: string | null;
};

export type ForumCategorySummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  threadCount: number;
};

export type ForumThreadCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  type: ForumThreadType;
  status: ForumThreadStatus;
  tags: string[];
  replyCount: number;
  hasSolution: boolean;
  authorName: string;
  createdAtIso: string;
  createdLabel: string;
  lastReplyLabel: string;
  category: {
    slug: string;
    name: string;
  };
  team: TeamIdentity | null;
};

export type ForumPostView = {
  id: string;
  body: string;
  score: number;
  authorName: string;
  createdAtIso: string;
  createdLabel: string;
  editedLabel: string | null;
};

export type ForumThreadDetail = {
  id: string;
  slug: string;
  title: string;
  body: string;
  type: ForumThreadType;
  status: ForumThreadStatus;
  tags: string[];
  replyCount: number;
  hasSolution: boolean;
  authorName: string;
  createdAtIso: string;
  createdLabel: string;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  team: TeamIdentity | null;
  replies: ForumPostView[];
};

export type ForumPageData = {
  categories: ForumCategorySummary[];
  selectedCategory: ForumCategorySummary | null;
  searchQuery: string;
  selectedThread: ForumThreadDetail | null;
  threads: ForumThreadCard[];
};

function displayName(user: UserIdentity) {
  return user.displayName ?? user.name ?? user.username ?? "Team member";
}

function summarizeText(value: string, maxLength = 220) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength - 3).trimEnd() + "...";
}

function formatDateLabel(value: Date | null) {
  if (!value) return "No replies yet";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(value);
}

export function forumSlugPart(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 54) || "discussion"
  );
}

export async function ensureForumCategories() {
  await prisma.forumCategory.createMany({
    data: DEFAULT_FORUM_CATEGORIES.map((category) => ({ ...category })),
    skipDuplicates: true,
  });
}

function threadWhere(categoryId?: string) {
  return {
    visibility: "PUBLIC" as const,
    status: { in: PUBLIC_THREAD_STATUSES },
    ...(categoryId ? { categoryId } : {}),
  };
}

export async function getForumPageData({ categorySlug, searchQuery, threadSlug }: ForumQuery): Promise<ForumPageData> {
  await ensureForumCategories();

  const categories = await prisma.forumCategory.findMany({
    where: { isArchived: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
    },
  });

  const selectedCategoryRecord = categorySlug ? categories.find((category) => category.slug === categorySlug) ?? null : null;
  const normalizedSearchQuery = searchQuery?.trim() ?? "";
  const baseWhere = threadWhere(selectedCategoryRecord?.id);

  const [categoryCounts, rawThreads, selectedThread] = await Promise.all([
    Promise.all(
      categories.map(async (category) => ({
        id: category.id,
        count: await prisma.forumThread.count({ where: threadWhere(category.id) }),
      })),
    ),
    prisma.forumThread.findMany({
      where: normalizedSearchQuery
        ? {
            ...baseWhere,
            OR: [
              { title: { contains: normalizedSearchQuery, mode: "insensitive" } },
              { body: { contains: normalizedSearchQuery, mode: "insensitive" } },
            ],
          }
        : baseWhere,
      orderBy: [{ lastReplyAt: "desc" }, { createdAt: "desc" }],
      take: normalizedSearchQuery ? 36 : 18,
      select: {
        id: true,
        slug: true,
        title: true,
        body: true,
        type: true,
        status: true,
        tags: true,
        createdAt: true,
        lastReplyAt: true,
        author: { select: { displayName: true, name: true, username: true } },
        category: { select: { slug: true, name: true } },
        team: { select: { id: true, name: true, teamNumber: true } },
        solution: { select: { id: true } },
        _count: { select: { posts: true } },
      },
    }),
    threadSlug
      ? prisma.forumThread.findFirst({
          where: {
            slug: threadSlug,
            ...threadWhere(),
          },
          select: {
            id: true,
            slug: true,
            title: true,
            body: true,
            type: true,
            status: true,
            tags: true,
            createdAt: true,
            author: { select: { displayName: true, name: true, username: true } },
            category: { select: { id: true, slug: true, name: true } },
            team: { select: { id: true, name: true, teamNumber: true } },
            solution: { select: { id: true } },
            posts: {
              where: { deletedAt: null },
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                body: true,
                createdAt: true,
                editedAt: true,
                author: { select: { displayName: true, name: true, username: true } },
                votes: { select: { value: true } },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const countByCategoryId = new Map(categoryCounts.map((entry) => [entry.id, entry.count]));
  const categoryViews = categories.map((category) => ({
    ...category,
    threadCount: countByCategoryId.get(category.id) ?? 0,
  }));
  const selectedCategory =
    selectedCategoryRecord ? categoryViews.find((category) => category.id === selectedCategoryRecord.id) ?? null : null;

  return {
    categories: categoryViews,
    selectedCategory,
    searchQuery: normalizedSearchQuery,
    threads: rawThreads.map((thread) => ({
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      excerpt: summarizeText(thread.body),
      type: thread.type,
      status: thread.status,
      tags: thread.tags,
      replyCount: thread._count.posts,
      hasSolution: Boolean(thread.solution),
      authorName: displayName(thread.author),
      createdAtIso: thread.createdAt.toISOString(),
      createdLabel: formatDateLabel(thread.createdAt),
      lastReplyLabel: formatDateLabel(thread.lastReplyAt ?? thread.createdAt),
      category: thread.category,
      team: thread.team,
    })),
    selectedThread: selectedThread
      ? {
          id: selectedThread.id,
          slug: selectedThread.slug,
          title: selectedThread.title,
          body: selectedThread.body,
          type: selectedThread.type,
          status: selectedThread.status,
          tags: selectedThread.tags,
          replyCount: selectedThread.posts.length,
          hasSolution: Boolean(selectedThread.solution),
          authorName: displayName(selectedThread.author),
          createdAtIso: selectedThread.createdAt.toISOString(),
          createdLabel: formatDateLabel(selectedThread.createdAt),
          category: selectedThread.category,
          team: selectedThread.team,
          replies: selectedThread.posts.map((post) => ({
            id: post.id,
            body: post.body,
            score: post.votes.reduce((sum, vote) => sum + (vote.value === "UP" ? 1 : -1), 0),
            authorName: displayName(post.author),
            createdAtIso: post.createdAt.toISOString(),
            createdLabel: formatDateLabel(post.createdAt),
            editedLabel: post.editedAt ? formatDateLabel(post.editedAt) : null,
          })),
        }
      : null,
  };
}
