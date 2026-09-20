"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect } from "react";

type WorkspaceSearchLinkProps = {
  href: string;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function WorkspaceSearchLink({ href }: WorkspaceSearchLinkProps) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || (!event.ctrlKey && !event.metaKey)) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      router.push(href);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [href, router]);

  return (
    <Link href={href} className="workspace-search" aria-label="Search BoltCanvas">
      <Search aria-hidden="true" size={16} />
      <span>Search your workspace</span>
      <kbd>Ctrl/Cmd K</kbd>
    </Link>
  );
}
