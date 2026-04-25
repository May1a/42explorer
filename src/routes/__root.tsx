import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";
import { SetupPage } from "../pages/Setup";
import { FullPageSpinner } from "../components/Loading";

function Root() {
  const { config, loading, authError, logout } = useAuth();

  if (loading) return <FullPageSpinner />;

  if (!config?.clientId) return <SetupPage />;

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--color-bg)" }}>
        <div className="w-full max-w-md rounded-2xl border p-8 space-y-4" style={{ background: "var(--color-card)", borderColor: "var(--color-red)" }}>
          <div className="text-lg font-bold" style={{ color: "var(--color-red)" }}>Auth error</div>
          <p className="text-sm font-mono break-all" style={{ color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>{authError}</p>
          <button
            onClick={logout}
            className="w-full py-2 rounded-xl text-sm font-bold"
            style={{ background: "var(--color-purple)", color: "#fff" }}
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
