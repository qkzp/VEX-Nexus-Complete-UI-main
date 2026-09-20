"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { InlineSpinner } from "./loading-states";

type PendingSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & {
  children: ReactNode;
  pendingLabel: string;
  compact?: boolean;
};

export function PendingSubmitButton({
  children,
  pendingLabel,
  compact = false,
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      {...props}
      type="submit"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={compact && pending ? pendingLabel : props["aria-label"]}
      data-pending={pending ? "true" : undefined}
    >
      {pending ? <InlineSpinner /> : children}
      {pending ? <span className={compact ? "sr-only" : undefined}>{pendingLabel}</span> : null}
    </button>
  );
}
