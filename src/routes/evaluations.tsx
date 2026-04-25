import { createFileRoute } from "@tanstack/react-router";
import { EvaluationsPage } from "../pages/Evaluations";

export const Route = createFileRoute("/evaluations")({
  component: EvaluationsPage,
});
