import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ProfilePage } from "../pages/Profile";

function ProfileRoute() {
  const { login } = useParams({ strict: false });
  const navigate = useNavigate();
  return <ProfilePage
    login={login}
    onNavigate={(page: string, extra?: string) => {
      if (page === "profile") navigate({ to: "/profile/$login", params: { login: extra! } });
      if (page === "students") navigate({ to: "/students" });
    }}
  />;
}

export const Route = createFileRoute("/profile/$login")({
  component: ProfileRoute,
});
