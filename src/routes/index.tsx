import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardPage } from "../pages/Dashboard";

function DashboardRoute() {
  const navigate = useNavigate();
  return <DashboardPage onNavigate={(page: string, extra?: string) => {
    if (page === "profile") navigate({ to: "/profile/$login", params: { login: extra! } });
    if (page === "locations") navigate({ to: "/locations" });
    if (page === "students") navigate({ to: "/students" });
  }} />;
}

export const Route = createFileRoute("/")({
  component: DashboardRoute,
});
