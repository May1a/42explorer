import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "../pages/ProjectPage";

export const Route = createFileRoute("/project/$id")({
  component: ProjectPage,
});
