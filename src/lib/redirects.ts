export type RedirectReason =
  | "missing_api"
  | "insufficient_scope"
  | "privileged_role_required"
  | "sensitive_action"
  | "unverified_workflow"
  | "api_error";

const REASON_LABELS: Record<RedirectReason, string> = {
  missing_api: "This feature is not available through the API.",
  insufficient_scope: "Your current permissions don't allow this action.",
  privileged_role_required: "This requires a privileged role (staff/tutor).",
  sensitive_action: "This action should be done on the official site.",
  unverified_workflow: "This workflow hasn't been verified for API use.",
  api_error: "The API returned an error.",
};

export function redirectReasonLabel(reason: RedirectReason): string {
  return REASON_LABELS[reason];
}

export function openOfficial(reason: RedirectReason, target?: string) {
  console.log(`[redirect] ${reason} → ${target ?? "profile.42.fr"}`);
  window.open(target ?? "https://profile.42.fr/", "_blank");
}
