"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { workspaceGroups } from "./workspace-nav";

export function WorkspaceLauncher({ href }: { href: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const teamId = new URL(href, "http://localhost").searchParams.get("team");
  const items = workspaceGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
  const results = items.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(query.trim().toLowerCase()));
  const activeIndex = Math.min(selected, results.length);

  function openLauncher() {
    setQuery("");
    setSelected(0);
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  }

  function navigate(path: string, search = false) {
    const url = new URL(path, "http://localhost");
    if (teamId) url.searchParams.set("team", teamId);
    if (search && query.trim()) url.searchParams.set("q", query.trim());
    dialogRef.current?.close();
    router.push(`${url.pathname}${url.search}`);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || (!event.ctrlKey && !event.metaKey)) return;
      if (dialogRef.current?.open) {
        event.preventDefault();
        dialogRef.current.close();
        return;
      }
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      setQuery("");
      setSelected(0);
      dialogRef.current?.showModal();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector(`#launcher-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return <>
    <button type="button" className="workspace-search" onClick={openLauncher} aria-haspopup="dialog">
      <Search aria-hidden="true" size={16} />
      <span>Search or jump to…</span><kbd>Ctrl / ⌘ K</kbd>
    </button>
    <dialog ref={dialogRef} className="workspace-launcher" aria-labelledby="launcher-title" onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
    }}>
      <h2 id="launcher-title" className="sr-only">Search and quick navigation</h2>
      <div className="launcher-input-row">
        <Search size={20} aria-hidden="true" />
        <input ref={inputRef} value={query} placeholder="Where do you want to go?" aria-label="Find a tool or search records" role="combobox" aria-expanded="true" aria-controls="launcher-results" aria-autocomplete="list" aria-activedescendant={`launcher-option-${activeIndex}`} onChange={(event) => { setQuery(event.target.value); setSelected(0); }} onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setSelected((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + results.length + 1) % (results.length + 1));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const item = results[activeIndex];
            navigate(item?.href ?? href, !item);
          }
        }} />
        <button type="button" className="launcher-close" aria-label="Close launcher" onClick={() => dialogRef.current?.close()}><X size={18} /></button>
      </div>
      <p className="launcher-label">{query.trim() ? "Matching tools" : "Jump to a tool"}</p>
      <div id="launcher-results" role="listbox" aria-label="Tools and workspace search" className="launcher-results">
        {results.map((item, index) => <button type="button" role="option" aria-selected={index === activeIndex} id={`launcher-option-${index}`} key={item.href} className={index === activeIndex ? "is-selected" : ""} onClick={() => navigate(item.href)}>
          <item.icon size={18} aria-hidden="true" /><span>{item.label}<small>{item.group}</small></span><ArrowUpRight size={15} aria-hidden="true" />
        </button>)}
        <button type="button" role="option" aria-selected={activeIndex === results.length} id={`launcher-option-${results.length}`} className={activeIndex === results.length ? "is-selected" : ""} onClick={() => navigate(href, true)}>
          <Search size={18} aria-hidden="true" /><span>{query.trim() ? `Search records for “${query.trim()}”` : "Search all workspace records"}<small>Tasks, robots & engineering notes</small></span><ArrowUpRight size={15} aria-hidden="true" />
        </button>
      </div>
      <footer><span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></footer>
    </dialog>
  </>;
}
