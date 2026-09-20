"use client";

import { useEffect, useRef, type RefObject } from "react";

type FormRef = RefObject<HTMLFormElement | null>;

export function useFormErrorFocus(error?: string, providedRef?: FormRef) {
  const internalRef = useRef<HTMLFormElement>(null);
  const formRef = providedRef ?? internalRef;

  useEffect(() => {
    if (!error) return;
    const target = formRef.current?.querySelector<HTMLElement>(
      "[aria-invalid='true'], :invalid, input:not([type='hidden']):not(:disabled), select:not(:disabled), textarea:not(:disabled), button[type='submit']:not(:disabled)",
    );
    target?.focus({ preventScroll: true });
  }, [error, formRef]);

  return formRef;
}
