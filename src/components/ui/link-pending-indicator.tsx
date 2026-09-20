"use client";

import { useLinkStatus } from "next/link";

export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      className={pending ? "workspace-nav-link-pending is-pending" : "workspace-nav-link-pending"}
      aria-hidden="true"
    />
  );
}
