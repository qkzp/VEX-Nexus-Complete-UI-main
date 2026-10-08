"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, LockKeyhole, Menu, Plus, UsersRound, X } from "lucide-react";
import { signOutAction } from "@/lib/actions/session";
import { setActiveTeamAction } from "@/lib/actions/workspace";
import type { WorkspaceTeam } from "@/lib/workspace/data";
import { WorkspaceNav } from "./workspace-nav";
import { WorkspaceLauncher } from "./workspace-launcher";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type WorkspaceShellProps = {
  teams: WorkspaceTeam[];
  activeTeamId: string | null;
  currentUser: {
    name: string | null;
    email: string | null;
  };
  children: React.ReactNode;
};

function initialsFor(name: string | null, email: string | null) {
  const source = (name || email || "U").trim();
  const tokens = source.split(/\s+/).filter(Boolean).slice(0, 2);
  if (!tokens.length) return "U";
  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("");
}

function withTeam(path: string, teamId: string | null) {
  if (!teamId) return path;
  const url = new URL(path, "http://localhost");
  url.searchParams.set("team", teamId);
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ""}`;
}

export function WorkspaceShell({ teams, activeTeamId, currentUser, children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamPickerRef = useRef<HTMLDetailsElement>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const requestedTeamId = searchParams.get("team");
  const currentTeamId =
    (requestedTeamId && teams.some((team) => team.id === requestedTeamId) ? requestedTeamId : activeTeamId) ?? null;
  const primaryTeam = teams.find((team) => team.id === currentTeamId) ?? teams[0];

  function currentLocationFor(teamId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("team", teamId);
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }

  const dashboardHref = withTeam("/app/dashboard", currentTeamId);
  const createRobotHref = withTeam("/robots?create=1", currentTeamId);
  const searchHref = withTeam("/search", currentTeamId);
  const tasksHref = withTeam("/team/tasks", currentTeamId);
  const teamHref = withTeam("/team", currentTeamId);
  const avatarInitials = initialsFor(currentUser.name, currentUser.email);

  useEffect(() => {
    function closeTeamPicker(event: KeyboardEvent | PointerEvent) {
      const picker = teamPickerRef.current;
      if (!picker?.open) return;
      const restoreTriggerFocus = event instanceof KeyboardEvent;

      if (restoreTriggerFocus) {
        if (event.key !== "Escape") return;
        event.preventDefault();
      } else if (event.target instanceof Node && picker.contains(event.target)) {
        return;
      }

      picker.open = false;
      if (restoreTriggerFocus) picker.querySelector<HTMLElement>("summary")?.focus();
    }

    document.addEventListener("keydown", closeTeamPicker);
    document.addEventListener("pointerdown", closeTeamPicker);
    return () => {
      document.removeEventListener("keydown", closeTeamPicker);
      document.removeEventListener("pointerdown", closeTeamPicker);
    };
  }, []);

  return (
    <div className="workspace-app">
      <a href="#workspace-content" className="workspace-skip-link">Skip to workspace</a>
      <aside className="workspace-sidebar" data-nav-open={navigationOpen}>
        <div className="workspace-brand-row">
        <Link className="workspace-brand" href={dashboardHref} aria-label="BoltCanvas command center">
          <Image className="workspace-mark-image" src="/boltcanvas-mark.svg" alt="" width={44} height={44} priority />
          <span>
            <strong>BoltCanvas</strong>
            <small>Robotics team hub</small>
          </span>
        </Link>
        <button type="button" className="workspace-mobile-menu" aria-label={navigationOpen ? "Close navigation" : "Open navigation"} aria-expanded={navigationOpen} aria-controls="workspace-navigation" onClick={() => setNavigationOpen(!navigationOpen)}>{navigationOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>

        <div className="workspace-team-summary">
          <span className="workspace-overline">Team selector</span>
          {primaryTeam ? (
            <details className="workspace-team-picker" ref={teamPickerRef}>
              <summary className="workspace-team-link" aria-controls="workspace-team-menu">
                <strong>{primaryTeam.teamNumber || primaryTeam.name}</strong>
                <span>{primaryTeam.teamNumber ? primaryTeam.name : "Private team"}</span>
                <ChevronRight aria-hidden="true" size={15} />
              </summary>
              <div
                className="workspace-team-picker-menu"
                id="workspace-team-menu"
                onClick={(event) => {
                  if (event.target instanceof Element && event.target.closest("a, button")) {
                    teamPickerRef.current?.removeAttribute("open");
                  }
                }}
              >
                {teams.map((team) => (
                  <form action={setActiveTeamAction} key={team.id}>
                    <input type="hidden" name="teamId" value={team.id} />
                    <input type="hidden" name="returnTo" value={currentLocationFor(team.id)} />
                    <PendingSubmitButton
                      className={team.id === primaryTeam.id ? "is-active" : ""}
                      pendingLabel="Switching team..."
                    >
                      <strong>{team.teamNumber || team.name}</strong>
                      <small>{team.teamNumber ? team.name : "Private workspace"}</small>
                    </PendingSubmitButton>
                  </form>
                ))}
                <div className="workspace-team-picker-actions">
                  <Link href="/join-team">Join with code</Link>
                  <Link href="/onboarding/team">Create team</Link>
                </div>
              </div>
            </details>
          ) : (
            <div className="workspace-team-empty-actions">
              <Link href="/join-team" className="workspace-team-link empty">
                <strong>Join a team</strong>
                <span>Enter a private invite code</span>
                <ChevronRight aria-hidden="true" size={15} />
              </Link>
              <Link href="/onboarding/team" className="workspace-team-create-mini">Create team</Link>
            </div>
          )}
        </div>

        <div id="workspace-navigation" className="workspace-navigation" onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) setNavigationOpen(false);
        }}><WorkspaceNav activeTeamId={currentTeamId} /></div>

        <div className="workspace-sidebar-footer">
          <Link href={createRobotHref} className="workspace-create-link">
            <Plus aria-hidden="true" size={15} />
            New robot
          </Link>
          <div className="workspace-user">
            <span className="workspace-avatar" aria-hidden="true">{avatarInitials}</span>
            <span>
              <strong>{currentUser.name || currentUser.email || "Workspace member"}</strong>
              <small>{currentUser.email || "Authenticated account"}</small>
            </span>
            <form action={signOutAction}>
              <PendingSubmitButton compact pendingLabel="Signing out" aria-label="Sign out" title="Sign out">
                <LockKeyhole aria-hidden="true" size={16} />
              </PendingSubmitButton>
            </form>
          </div>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-topbar-context">
            {primaryTeam ? (
              <div className="topbar-team-context">
                <span>ACTIVE TEAM</span>
                <strong>{primaryTeam.teamNumber || primaryTeam.name}</strong>
                <small>{primaryTeam.teamNumber ? primaryTeam.name : "Private workspace"}</small>
              </div>
            ) : (
              <div className="topbar-team-context">
                <span>WORKSPACE STATUS</span>
                <strong>No team selected</strong>
                <small>Create or join a team to unlock shared tools.</small>
              </div>
            )}
            <div className="workspace-topbar-summary">
              <span className="workspace-status-dot" aria-hidden="true" />
              Team workspace
            </div>
          </div>
          <div className="workspace-topbar-tools">
            <WorkspaceLauncher href={searchHref} />
            <Link href={tasksHref} className="workspace-topbar-action">Plan work</Link>
            <Link href={teamHref} className="workspace-topbar-secondary">
              <UsersRound aria-hidden="true" size={15} />
              Team
            </Link>
          </div>
        </header>
        <div className="workspace-route-slot" id="workspace-content" tabIndex={-1} key={pathname}>{children}</div>
      </main>
    </div>
  );
}
