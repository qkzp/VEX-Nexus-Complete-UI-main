"use server";

import { randomBytes } from "node:crypto";
import type { ForumThreadType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/authz";
import { databaseErrorMessage, ensureDatabaseReady, prisma } from "@/lib/db";
import { ensureForumCategories, forumSlugPart } from "@/lib/forum/service";
import { requireWorkspaceTeam } from "@/lib/workspace/data";

export type ForumComposerState = {
  error?: string;
  success?: string;
  threadSlug?: string;
  categorySlug?: string;
};

export type ForumReplyState = {
  error?: string;
  success?: string;
  threadSlug?: string;
};

const forumThreadTypes = ["QUESTION", "DISCUSSION", "GUIDE", "BUILD_LOG", "SHOWCASE", "RESOURCE"] as const satisfies readonly ForumThreadType[];

const createThreadSchema = z.object({
  title: z.string().trim().min(6, "Add a clearer discussion title.").max(120, "Keep the title under 120 characters."),
  body: z.string().trim().min(20, "Add enough detail for other teams to help.").max(6000, "Keep the post under 6000 characters."),
  categoryId: z.string().trim().min(1, "Choose a forum category."),
  teamId: z.string().trim().max(128).optional(),
  tags: z.string().trim().max(180).optional(),
  type: z.enum(forumThreadTypes),
});

const createReplySchema = z.object({
  threadId: z.string().trim().min(1, "That discussion could not be found."),
  body: z.string().trim().min(6, "Write a reply before posting.").max(4000, "Keep the reply under 4000 characters."),
});

function parseTags(value: string | undefined) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((tag) => forumSlugPart(tag).slice(0, 24))
        .filter(Boolean),
    ),
  ).slice(0, 6);
}

async function createUniqueThreadSlug(title: string) {
  const stem = forumSlugPart(title);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = `${stem}-${randomBytes(3).toString("hex")}`;
    const existing = await prisma.forumThread.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
  }

  return `${stem}-${randomBytes(5).toString("hex")}`;
}

export async function createForumThreadAction(
  _: ForumComposerState,
  formData: FormData,
): Promise<ForumComposerState> {
  const parsed = createThreadSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    categoryId: formData.get("categoryId"),
    teamId: formData.get("teamId"),
    tags: formData.get("tags"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Review the discussion details and try again." };
  }

  try {
    await ensureDatabaseReady();
    await ensureForumCategories();
    const user = await requireCurrentUser("/forum");

    const category = await prisma.forumCategory.findFirst({
      where: { id: parsed.data.categoryId, isArchived: false },
      select: { id: true, slug: true },
    });
    if (!category) return { error: "Choose an active forum category." };

    const teamId = parsed.data.teamId?.trim() || null;
    if (teamId) {
      await requireWorkspaceTeam(user.id, teamId, "VIEWER");
    }

    const slug = await createUniqueThreadSlug(parsed.data.title);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const thread = await tx.forumThread.create({
        data: {
          slug,
          title: parsed.data.title,
          body: parsed.data.body,
          type: parsed.data.type,
          tags: parseTags(parsed.data.tags),
          visibility: "PUBLIC",
          status: "OPEN",
          categoryId: category.id,
          authorId: user.id,
          teamId,
          lastReplyAt: now,
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "forum.thread.create",
          targetType: "ForumThread",
          targetId: thread.id,
          metadata: { categoryId: category.id, teamId },
        },
      });
    });

    revalidatePath("/forum");
    return { success: "Discussion posted.", threadSlug: slug, categorySlug: category.slug };
  } catch (error) {
    return { error: databaseErrorMessage(error) ?? "The discussion could not be posted right now." };
  }
}

export async function createForumReplyAction(_: ForumReplyState, formData: FormData): Promise<ForumReplyState> {
  const parsed = createReplySchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write a reply before posting." };
  }

  try {
    await ensureDatabaseReady();
    const user = await requireCurrentUser("/forum");

    const thread = await prisma.forumThread.findFirst({
      where: {
        id: parsed.data.threadId,
        visibility: "PUBLIC",
        status: { in: ["OPEN", "LOCKED", "ARCHIVED"] },
      },
      select: { id: true, slug: true, status: true },
    });
    if (!thread) return { error: "That discussion is no longer available." };
    if (thread.status === "LOCKED") return { error: "This discussion is locked." };
    if (thread.status === "ARCHIVED") return { error: "Archived discussions cannot receive new replies." };

    await prisma.$transaction(async (tx) => {
      const post = await tx.forumPost.create({
        data: {
          threadId: thread.id,
          authorId: user.id,
          body: parsed.data.body,
        },
        select: { id: true },
      });

      await tx.forumThread.update({
        where: { id: thread.id },
        data: { lastReplyAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "forum.post.create",
          targetType: "ForumPost",
          targetId: post.id,
          metadata: { threadId: thread.id },
        },
      });
    });

    revalidatePath("/forum");
    return { success: "Reply posted.", threadSlug: thread.slug };
  } catch (error) {
    return { error: databaseErrorMessage(error) ?? "The reply could not be posted right now." };
  }
}
