"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, startTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  Flame,
  Layers3,
  MessageSquareText,
  MessagesSquare,
  MoveRight,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";
import {
  createForumReplyAction,
  createForumThreadAction,
  type ForumComposerState,
  type ForumReplyState,
} from "@/lib/actions/forum";
import type { ForumCategorySummary, ForumPageData, ForumThreadDetail } from "@/lib/forum/service";
import type { WorkspaceTeam } from "@/lib/workspace/data";
import { InlineSpinner } from "@/components/ui/loading-states";
import { useFormErrorFocus } from "@/components/ui/use-form-error-focus";

type ForumBoardProps = ForumPageData & {
  teams: WorkspaceTeam[];
  selectedTeamId: string | null;
};

const EMPTY_COMPOSER: ForumComposerState = {};
const EMPTY_REPLY: ForumReplyState = {};

const TYPE_LABELS = {
  QUESTION: "Question",
  DISCUSSION: "Discussion",
  GUIDE: "Guide",
  BUILD_LOG: "Build log",
  SHOWCASE: "Showcase",
  RESOURCE: "Resource",
} as const;

const TYPE_SUMMARIES = {
  QUESTION: "Needs troubleshooting or a direct answer.",
  DISCUSSION: "Open-ended design or match conversation.",
  GUIDE: "Structured how-to content another team can reuse.",
  BUILD_LOG: "Lessons from a real robot iteration.",
  SHOWCASE: "Finished work worth inspecting.",
  RESOURCE: "Reference links, templates, or source material.",
} as const;

function threadLink(searchParams: URLSearchParams, thread: { slug: string; category: { slug: string } }) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("thread", thread.slug);
  params.set("category", thread.category.slug);
  const query = params.toString();
  return query ? `/forum?${query}` : "/forum";
}

function categoryLink(searchParams: URLSearchParams, category: ForumCategorySummary | null) {
  const params = new URLSearchParams(searchParams.toString());
  if (category) params.set("category", category.slug);
  else params.delete("category");
  params.delete("thread");
  const query = params.toString();
  return query ? `/forum?${query}` : "/forum";
}

function clearThreadLink(searchParams: URLSearchParams, selectedThread: ForumThreadDetail | null) {
  if (!selectedThread) return "/forum";
  const params = new URLSearchParams(searchParams.toString());
  params.delete("thread");
  const query = params.toString();
  return query ? `/forum?${query}` : "/forum";
}

export function ForumBoard({
  categories,
  searchQuery,
  selectedCategory,
  selectedThread,
  selectedTeamId,
  teams,
  threads,
}: ForumBoardProps) {
  const [composerState, composerAction, composerPending] = useActionState(createForumThreadAction, EMPTY_COMPOSER);
  const [replyState, replyAction, replyPending] = useActionState(createForumReplyAction, EMPTY_REPLY);
  const createFormRef = useRef<HTMLFormElement>(null);
  const replyFormRef = useRef<HTMLFormElement>(null);
  useFormErrorFocus(composerState.error, createFormRef);
  useFormErrorFocus(replyState.error, replyFormRef);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openThreadCount = threads.filter((thread) => thread.status === "OPEN").length;
  const solvedThreadCount = threads.filter((thread) => thread.hasSolution).length;
  const totalReplies = threads.reduce((sum, thread) => sum + thread.replyCount, 0);
  const totalVisibleDiscussions = categories.reduce((sum, category) => sum + category.threadCount, 0);

  useEffect(() => {
    if (!composerState.threadSlug) return;

    createFormRef.current?.reset();
    const params = new URLSearchParams(searchParams.toString());
    params.set("thread", composerState.threadSlug);
    if (composerState.categorySlug) params.set("category", composerState.categorySlug);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
      router.refresh();
    });
  }, [composerState.categorySlug, composerState.threadSlug, pathname, router, searchParams]);

  useEffect(() => {
    if (!replyState.success) return;

    replyFormRef.current?.reset();
    startTransition(() => {
      router.refresh();
    });
  }, [replyState.success, router]);

  return (
    <>
      <section className="suite-panel forum-intro-panel">
        <div className="forum-intro-grid">
          <div className="forum-intro-copy">
            <span className="section-overline">Public community</span>
            <h2>Teams can ask, answer, and publish fixes that survive past one conversation.</h2>
            <p className="forum-intro-summary">
              Keep the forum practical: real failures, working code patterns, build tradeoffs, event prep notes, and
              documentation another team can actually apply.
            </p>
          </div>
          <div className="forum-command-panel">
            <form className="inline-search forum-search-form" action="/forum">
              {selectedTeamId ? <input type="hidden" name="team" value={selectedTeamId} /> : null}
              {selectedCategory ? <input type="hidden" name="category" value={selectedCategory.slug} /> : null}
              <Search size={15} />
              <input name="q" defaultValue={searchQuery} placeholder="Search public discussions, tags, and fixes" />
              <button className="button button-quiet" type="submit">
                Search
              </button>
            </form>
            <div className="forum-intro-metrics">
              <div>
                <small>Visible discussions</small>
                <strong>{totalVisibleDiscussions}</strong>
              </div>
              <div>
                <small>Open help requests</small>
                <strong>{openThreadCount}</strong>
              </div>
              <div>
                <small>Replies posted</small>
                <strong>{totalReplies}</strong>
              </div>
              <div>
                <small>Marked solved</small>
                <strong>{solvedThreadCount}</strong>
              </div>
            </div>
          </div>
        </div>
        <p className="source-status">
          Threads are public to signed-in PitRelay workspaces. Private team notes, tasks, and notebook content stay out of
          this forum unless a team member posts them here deliberately.
        </p>
      </section>

      <div className="forum-layout forum-layout-upgraded">
        <div className="forum-main-column">
          <section className="suite-panel forum-discovery-panel">
            <div className="forum-discovery-header">
              <div>
                <span className="section-overline">Browse lanes</span>
                <h2>Start from the problem type, not from a blank page.</h2>
              </div>
              <span className="status-chip neutral">{categories.length} categories</span>
            </div>
            <div className="forum-lane-grid">
              <Link className={!selectedCategory ? "forum-lane-card is-active" : "forum-lane-card"} href={categoryLink(searchParams, null)}>
                <Layers3 size={18} />
                <strong>All discussions</strong>
                <span>{totalVisibleDiscussions} total threads across the forum.</span>
              </Link>
              {categories.map((category) => (
                <Link
                  className={selectedCategory?.id === category.id ? "forum-lane-card is-active" : "forum-lane-card"}
                  href={categoryLink(searchParams, category)}
                  key={category.id}
                >
                  <MessageSquareText size={18} />
                  <strong>{category.name}</strong>
                  <span>{category.description}</span>
                  <small>{category.threadCount} thread{category.threadCount === 1 ? "" : "s"}</small>
                </Link>
              ))}
            </div>
          </section>

          {selectedThread ? (
            <section className="suite-panel forum-detail">
              <div className="suite-panel-heading">
                <div>
                  <div className="suite-badges">
                    <span className="status-chip neutral">{TYPE_LABELS[selectedThread.type]}</span>
                    <span className={`status-chip ${selectedThread.status === "OPEN" ? "good" : "warn"}`}>
                      {selectedThread.status.toLowerCase()}
                    </span>
                    {selectedThread.team ? (
                      <span className="status-chip neutral">
                        {selectedThread.team.teamNumber || selectedThread.team.name}
                      </span>
                    ) : null}
                    {selectedThread.hasSolution ? <span className="status-chip good">solution marked</span> : null}
                  </div>
                  <h2>{selectedThread.title}</h2>
                  <p className="forum-detail-summary">{TYPE_SUMMARIES[selectedThread.type]}</p>
                </div>
                <Link className="button button-quiet" href={clearThreadLink(searchParams, selectedThread)}>
                  Back to list
                </Link>
              </div>

              <div className="forum-meta-row">
                <span>
                  <Clock3 size={13} />
                  Started {selectedThread.createdLabel}
                </span>
                <span>
                  <MessageSquareText size={13} />
                  {selectedThread.replyCount} repl{selectedThread.replyCount === 1 ? "y" : "ies"}
                </span>
                <span>
                  <ShieldCheck size={13} />
                  {selectedThread.authorName}
                </span>
              </div>

              <article className="forum-post forum-post-root">
                <div className="forum-post-header">
                  <strong>{selectedThread.authorName}</strong>
                  <span>Original post</span>
                </div>
                <p className="forum-detail-body">{selectedThread.body}</p>
                {selectedThread.tags.length ? (
                  <div className="forum-tag-list">
                    {selectedThread.tags.map((tag) => (
                      <span className="forum-tag" key={tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>

              <div className="forum-reply-section">
                <div className="forum-reply-heading">
                  <h3>Replies</h3>
                  <small>{selectedThread.replyCount} total</small>
                </div>
                {selectedThread.replies.length ? (
                  <div className="forum-post-list">
                    {selectedThread.replies.map((reply) => (
                      <article className="forum-post" key={reply.id}>
                        <div className="forum-post-header">
                          <div>
                            <strong>{reply.authorName}</strong>
                            <small>{reply.createdLabel}</small>
                          </div>
                          <div className="forum-post-score">
                            <span>{reply.score >= 0 ? `+${reply.score}` : String(reply.score)}</span>
                            {reply.editedLabel ? <small>Edited {reply.editedLabel}</small> : null}
                          </div>
                        </div>
                        <p>{reply.body}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="suite-empty">No replies yet. Start the thread.</div>
                )}

                {selectedThread.status === "OPEN" ? (
                  <form className="forum-reply-form" ref={replyFormRef} action={replyAction} aria-busy={replyPending}>
                    <input type="hidden" name="threadId" value={selectedThread.id} />
                    {replyState.error ? <p className="form-message is-error" role="alert">{replyState.error}</p> : null}
                    {replyState.success ? <p className="form-message is-success" role="status">{replyState.success}</p> : null}
                    <label>
                      Reply
                      <textarea
                        name="body"
                        required
                        placeholder="Share the fix, tradeoff, code pattern, or build advice that actually worked."
                        rows={5}
                      />
                    </label>
                    <button className="button button-primary" type="submit" disabled={replyPending}>
                      {replyPending ? <InlineSpinner /> : <ArrowRight size={14} />}
                      {replyPending ? "Posting..." : "Post reply"}
                    </button>
                  </form>
                ) : (
                  <p className="forum-inline-note">
                    This discussion is read-only because it is {selectedThread.status.toLowerCase()}.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          <section className="suite-panel">
            <div className="suite-panel-heading">
              <div>
                <span className="section-overline">
                  {selectedCategory ? selectedCategory.name : "All categories"}
                </span>
                <h2>{searchQuery ? `Matching discussions for "${searchQuery}"` : "Recent discussions"}</h2>
                <p className="forum-section-summary">
                  {selectedCategory?.description ??
                    "Open threads, guides, and field-tested answers from the public PitRelay community."}
                </p>
              </div>
              <span className="status-chip neutral">{threads.length} shown</span>
            </div>

            <div className="forum-threads">
              {threads.map((thread) => (
                <article className="forum-thread forum-thread-upgraded" key={thread.id}>
                  <div className="thread-body">
                    <div className="forum-thread-topline">
                      <span className="status-chip neutral">{TYPE_LABELS[thread.type]}</span>
                      <span className={`status-chip ${thread.status === "OPEN" ? "good" : "warn"}`}>
                        {thread.status.toLowerCase()}
                      </span>
                      <span className="status-chip neutral">{thread.category.name}</span>
                      {thread.team ? (
                        <span className="status-chip neutral">{thread.team.teamNumber || thread.team.name}</span>
                      ) : null}
                      {thread.hasSolution ? <span className="status-chip good">solved</span> : null}
                    </div>
                    <h3>
                      <Link className="forum-thread-link" href={threadLink(searchParams, thread)}>
                        {thread.title}
                      </Link>
                    </h3>
                    <p>{thread.excerpt}</p>
                    {thread.tags.length ? (
                      <div className="forum-tag-list">
                        {thread.tags.map((tag) => (
                          <span className="forum-tag" key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <footer>
                      <span>
                        <ShieldCheck size={13} />
                        {thread.authorName}
                      </span>
                      <span>
                        <Clock3 size={13} />
                        {thread.lastReplyLabel}
                      </span>
                      <span>
                        <MessagesSquare size={13} />
                        {thread.replyCount} repl{thread.replyCount === 1 ? "y" : "ies"}
                      </span>
                      <span>
                        <Tags size={13} />
                        {thread.tags.length} tag{thread.tags.length === 1 ? "" : "s"}
                      </span>
                      <Link href={threadLink(searchParams, thread)}>
                        Open thread <MoveRight size={12} />
                      </Link>
                    </footer>
                  </div>
                </article>
              ))}
              {!threads.length ? (
                <div className="suite-empty">
                  {searchQuery
                    ? "No public discussions matched that search yet."
                    : "No public discussions yet. Start the first one in the composer."}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="forum-sidebar forum-sidebar-upgraded">
          <section className="panel forum-composer-panel">
            <div className="forum-sidebar-heading">
              <div>
                <span className="section-overline">Start a thread</span>
                <h2>Ask for help or share a useful answer.</h2>
              </div>
              <Plus size={18} />
            </div>
            <div className="forum-composer-intro">
              <div>
                <strong>Best for</strong>
                <span>Questions, design tradeoffs, code fixes, and reusable guides.</span>
              </div>
              <div>
                <strong>Avoid posting</strong>
                <span>Private scouting notes, full notebook drafts, or internal team planning.</span>
              </div>
            </div>
            <form className="forum-composer" ref={createFormRef} action={composerAction} aria-busy={composerPending}>
              {composerState.error ? <p className="form-message is-error" role="alert">{composerState.error}</p> : null}
              {composerState.success ? <p className="form-message is-success" role="status">{composerState.success}</p> : null}
              <label>
                Title
                <input name="title" required placeholder="Example: Intake keeps jamming after the third cycle" />
              </label>
              <div className="forum-composer-row">
                <label>
                  Category
                  <select name="categoryId" defaultValue={selectedCategory?.id ?? categories[0]?.id ?? ""}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Type
                  <select name="type" defaultValue="QUESTION">
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="forum-type-note">
                <FileText size={14} />
                <span>
                  Use <strong>Guide</strong> for step-by-step help and <strong>Question</strong> when you need
                  troubleshooting.
                </span>
              </div>
              <label>
                Post as
                <select name="teamId" defaultValue={selectedTeamId ?? ""}>
                  <option value="">My account only</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.teamNumber ? `${team.teamNumber} / ${team.name}` : team.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tags
                <input name="tags" placeholder="auton, sensors, drivetrain" />
              </label>
              <label>
                Details
                <textarea
                  name="body"
                  required
                  rows={8}
                  placeholder="Include the problem, what you already tried, and the actual constraints other teams should know."
                />
              </label>
              <button className="button button-primary" type="submit" disabled={composerPending}>
                {composerPending ? <InlineSpinner /> : <Sparkles size={14} />}
                {composerPending ? "Posting..." : "Post discussion"}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="forum-sidebar-heading">
              <div>
                <span className="section-overline">Quick filters</span>
                <h2>What is moving right now?</h2>
              </div>
              <Flame size={18} />
            </div>
            <div className="forum-insight-list">
              <div className="forum-insight-card">
                <strong>{openThreadCount}</strong>
                <span>Open discussions still need replies.</span>
              </div>
              <div className="forum-insight-card">
                <strong>{solvedThreadCount}</strong>
                <span>Threads already have a marked solution.</span>
              </div>
              <div className="forum-insight-card">
                <strong>{searchQuery ? "Search mode" : selectedCategory ? selectedCategory.name : "All topics"}</strong>
                <span>{searchQuery ? `Filtering by "${searchQuery}".` : "Use category lanes to narrow the list."}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="forum-sidebar-heading">
              <div>
                <span className="section-overline">Posting standard</span>
                <h2>Keep the advice usable.</h2>
              </div>
              <CircleHelp size={18} />
            </div>
            <div className="forum-guidance-list">
              <p>Describe the actual robot, code, field, or event context before asking for help.</p>
              <p>Say what you tested already so replies do not waste time on dead ends.</p>
              <p>Link out only when the source is worth another team&apos;s time.</p>
              <a href="https://kb.roboticseducation.org/" target="_blank" rel="noreferrer">
                Official REC Library <ExternalLink size={13} />
              </a>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
