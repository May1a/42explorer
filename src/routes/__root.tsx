import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";
import { FullPageSpinner } from "../components/Loading";

function Root() {
  const { loading, authError, logout } = useAuth();

  if (loading) return <FullPageSpinner />;

  if (authError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "var(--color-bg)" }}
      >
        <div
          className="w-full max-w-md border p-8 space-y-4"
          style={{
            background: "var(--color-surface)",
            borderColor: "color-mix(in srgb, var(--color-red) 35%, var(--color-border))",
            borderRadius: 4,
          }}
        >
          <div className="text-lg font-semibold" style={{ color: "var(--color-red)" }}>Auth error</div>
          <p className="text-sm break-all" style={{ color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>{authError}</p>
          <button
            onClick={logout}
            className="w-full py-2 rounded-md text-sm font-semibold btn-primary"
          >
            Reset &amp; try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const Route = createRootRoute({
  component: Root,
});
