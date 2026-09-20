type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({ className = "" }: LoadingSkeletonProps) {
  return <span className={`ui-skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function InlineSpinner({ className = "" }: LoadingSkeletonProps) {
  return <span className={`ui-inline-spinner ${className}`.trim()} aria-hidden="true" />;
}

export function WorkspaceRouteLoading() {
  return (
    <div className="workspace-route-loading" role="status" aria-live="polite" aria-label="Loading workspace content">
      <div className="workspace-loading-heading">
        <div>
          <LoadingSkeleton className="is-kicker" />
          <LoadingSkeleton className="is-title" />
          <LoadingSkeleton className="is-copy" />
        </div>
        <LoadingSkeleton className="is-action" />
      </div>
      <div className="workspace-loading-grid">
        <LoadingSkeleton className="is-panel is-panel-wide" />
        <LoadingSkeleton className="is-panel" />
        <LoadingSkeleton className="is-panel" />
      </div>
      <span className="sr-only">Loading the latest team workspace data.</span>
    </div>
  );
}

export function AuthRouteLoading() {
  return (
    <main className="auth-route-loading" role="status" aria-live="polite" aria-label="Loading account page">
      <aside aria-hidden="true">
        <LoadingSkeleton className="is-auth-mark" />
        <div>
          <LoadingSkeleton className="is-auth-line" />
          <LoadingSkeleton className="is-auth-hero" />
          <LoadingSkeleton className="is-auth-copy" />
        </div>
      </aside>
      <section aria-hidden="true">
        <div className="auth-loading-card">
          <LoadingSkeleton className="is-kicker" />
          <LoadingSkeleton className="is-title" />
          <LoadingSkeleton className="is-copy" />
          <LoadingSkeleton className="is-field" />
          <LoadingSkeleton className="is-field" />
          <LoadingSkeleton className="is-submit" />
        </div>
      </section>
      <span className="sr-only">Loading BoltCanvas account access.</span>
    </main>
  );
}
