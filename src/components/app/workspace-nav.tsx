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
  { label: "TEAM", items: [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/team/tasks", label: "Tasks", icon: ClipboardCheck },
    { href: "/team", label: "Team settings", icon: UsersRound },
    { href: "/forum", label: "Team forum", icon: MessageSquareText },
  ]},
  { label: "ROBOT", items: [
    { href: "/robots", label: "Robots", icon: Bot },
    { href: "/testing", label: "Testing", icon: Activity },
    { href: "/field-lab", label: "Autonomous", icon: Crosshair },
    { href: "/code", label: "Code Lab", icon: Braces },
  ]},
  { label: "TOOLS", items: [
    { href: "/calculators", label: "Calculators", icon: Calculator },
    { href: "/notebook", label: "Engineering notebook", icon: BookOpenText },
  ]},
  { label: "COMPETE", items: [
    { href: "/events", label: "Event Mode", icon: CalendarDays },
    { href: "/strategy", label: "Scouting & strategy", icon: Scale },
    { href: "/rules", label: "Rules", icon: ShieldCheck },
    { href: "/rankings", label: "World Skills", icon: Trophy },
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
