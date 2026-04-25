import { createFileRoute } from "@tanstack/react-router";
import { SetupPage } from "../pages/Setup";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});
