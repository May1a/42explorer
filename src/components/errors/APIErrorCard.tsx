import { openOfficial, redirectReasonLabel, type RedirectReason } from "../../lib/redirects";

export function APIErrorCard({ status, redirectReason }: { status?: number; redirectReason?: RedirectReason }) {
  if (status === 429) {
    return (
      <div
        className="rounded-md border p-4 md:p-5"
        style={{
          background: "var(--color-surface)",
          borderColor: "color-mix(in srgb, var(--color-yellow) 35%, var(--color-border))",
        }}
      >
        <div className="text-sm font-semibold" style={{ color: "var(--color-yellow)" }}>Rate limited</div>
        <div className="text-[13px] mt-1" style={{ color: "var(--color-muted)" }}>
          The 42 API is rate-limiting requests. Please wait a moment and try again.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-md border p-4 md:p-5"
      style={{
        background: "var(--color-surface)",
        borderColor: "color-mix(in srgb, var(--color-red) 35%, var(--color-border))",
      }}
    >
      <div className="text-sm font-semibold" style={{ color: "var(--color-red)" }}>
        {status === 401 ? "Session expired" : status === 403 ? "Access denied" : status === 404 ? "Not found" : `Error ${status ?? ""}`}
      </div>
      <div className="text-[13px] mt-1" style={{ color: "var(--color-muted)" }}>
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
          className="mt-2 text-[12.5px] font-semibold px-3 py-1.5 rounded-md btn-primary"
        >
          {redirectReasonLabel(redirectReason)} · Open on 42
        </button>
      )}
    </div>
  );
}
