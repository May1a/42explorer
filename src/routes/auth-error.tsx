import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth-error")({
  component: () => (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-md rounded-2xl border p-8 space-y-4 text-center" style={{ background: "var(--color-card)", borderColor: "var(--color-red)" }}>
        <div className="text-lg font-bold" style={{ color: "var(--color-red)" }}>Auth error</div>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>Authentication failed. Go back and try again.</p>
      </div>
    </div>
  ),
});
