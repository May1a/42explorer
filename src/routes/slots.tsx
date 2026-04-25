import { createFileRoute } from "@tanstack/react-router";
import { SlotsPage } from "../pages/Slots";

export const Route = createFileRoute("/slots")({
  component: SlotsPage,
});
