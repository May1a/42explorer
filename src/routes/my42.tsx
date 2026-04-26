import { createFileRoute } from "@tanstack/react-router";
import { My42Page } from "../pages/My42";

function My42Route() {
  return <My42Page />;
}

export const Route = createFileRoute("/my42")({
  component: My42Route,
});
