"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  ClipboardCheck,
  BookOpenText,
  Bot,
  Braces,
  Calculator,
  CalendarDays,
  Crosshair,
  LayoutDashboard,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Trophy,
  UsersRound,
} from "lucide-react";
import { LinkPendingIndicator } from "@/components/ui/link-pending-indicator";

const groups = [
  { label: "", items: [{ href: "/app/dashboard", label: "Command center", icon: LayoutDashboard }] },
  { label: "BUILD", items: [
    { href: "/robots", label: "Robots", icon: Bot },
    { href: "/calculators", label: "Calculators", icon: Calculator },
    { href: "/testing", label: "Testing", icon: Activity },
  ]},
  { label: "CODE", items: [
    { href: "/code", label: "Code Lab", icon: Braces },
    { href: "/field-lab", label: "Autonomous", icon: Crosshair },
  ]},
  { label: "COMPETE", items: [
    { href: "/events", label: "Event Mode", icon: CalendarDays },
    { href: "/strategy", label: "Scouting & Strategy", icon: Scale },
    { href: "/rules", label: "Rules", icon: ShieldCheck },
    { href: "/rankings", label: "World Skills", icon: Trophy },
  ]},
  { label: "TEAM", items: [
    { href: "/team/tasks", label: "Team tasks", icon: ClipboardCheck },
    { href: "/notebook", label: "Notebook", icon: BookOpenText },
    { href: "/forum", label: "Community Forum", icon: MessageSquareText },
    { href: "/team", label: "Members & Invites", icon: UsersRound },
  ]},
] as const;

function current(pathname: string, href: string) {
  if (href === "/app/dashboard") return pathname === "/app" || pathname === href || pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function withTeam(href: string, teamId: string | null) {
  if (!teamId) return href;
  const url = new URL(href, "http://localhost");
  url.searchParams.set("team", teamId);
  const query = url.searchParams.toString();
  return `${url.pathname}${query ? `?${query}` : ""}`;
}

export function WorkspaceNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team");

  return (
    <nav className="workspace-nav" aria-label="Workspace">
      {groups.map((group) => (
        <div className="workspace-nav-group" key={group.label || "home"}>
          {group.label ? <span className="workspace-nav-heading">{group.label}</span> : null}
          {group.items.map(({ href, label, icon: Icon }) => {
            const isCurrent = current(pathname, href);
            return (
              <Link
                key={href}
                href={withTeam(href, teamId)}
                className={isCurrent ? "workspace-nav-link is-current" : "workspace-nav-link"}
                aria-current={isCurrent ? "page" : undefined}
              >
                <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                <span>{label}</span>
                <LinkPendingIndicator />
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
