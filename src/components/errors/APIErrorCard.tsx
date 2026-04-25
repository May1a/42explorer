import { openOfficial, redirectReasonLabel, type RedirectReason } from "../../lib/redirects";

export function APIErrorCard({ status, redirectReason }: { status?: number; redirectReason?: RedirectReason }) {
  if (status === 429) {
    return (
      <div
        className="rounded-xl border p-4 md:p-5"
        style={{ background: "var(--color-card)", borderColor: "var(--color-yellow)" }}
      >
        <div className="text-sm font-bold" style={{ color: "var(--color-yellow)" }}>Rate Limited</div>
        <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
          The 42 API is rate-limiting requests. Please wait a moment and try again.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-4 md:p-5"
      style={{ background: "var(--color-card)", borderColor: "var(--color-red)" }}
    >
      <div className="text-sm font-bold" style={{ color: "var(--color-red)" }}>
        {status === 401 ? "Session Expired" : status === 403 ? "Access Denied" : status === 404 ? "Not Found" : `Error ${status ?? ""}`}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
        {status === 401
          ? "Your session has expired. Please log in again."
          : status === 403
            ? "You don't have permission to access this resource."
            : status === 404
              ? "The requested resource was not found."
              : "An unexpected error occurred."}
      </div>
      {redirectReason && (
        <button
          onClick={() => openOfficial(redirectReason)}
          className="mt-2 text-xs font-semibold px-3 py-1 rounded-lg transition-all"
          style={{ background: "var(--color-primary)", color: "#000" }}
        >
          {redirectReasonLabel(redirectReason)} Open on 42 →
        </button>
      )}
    </div>
  );
}
