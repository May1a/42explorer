import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LocationsPage } from "../pages/Locations";

function LocationsRoute() {
  const navigate = useNavigate();
  return <LocationsPage onNavigate={(page: string, extra?: string) => {
    if (page === "profile") navigate({ to: "/profile/$login", params: { login: extra! } });
  }} />;
}

export const Route = createFileRoute("/locations")({
  component: LocationsRoute,
});
