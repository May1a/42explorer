import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StudentsPage } from "../pages/Students";

function StudentsRoute() {
  const navigate = useNavigate();
  return <StudentsPage onNavigate={(page: string, extra?: string) => {
    if (page === "profile") navigate({ to: "/profile/$login", params: { login: extra! } });
  }} />;
}

export const Route = createFileRoute("/students")({
  component: StudentsRoute,
});
