# Alternative profile.42.fr Client Plan

Last checked against the public 42 API docs on 2026-04-26.

## Goal

Build an API-first alternative client for the student-facing `profile.42.fr` experience, with clear redirects back to the official site whenever the API is missing, privileged, risky, or too workflow-sensitive.

This should feel like a polished daily driver for reading profile data, project progress, campus activity, locations, events, coalitions, achievements, and correction/evaluation state. It should not pretend to fully replace official 42 workflows that require privileged app roles or exact platform behavior.

## Primary Strategy

Use the 42 API for everything that is reliably exposed and safe for a third-party client:

- User authentication via OAuth2 Authorization Code flow.
- Profile and dashboard data via `/v2/me` and `/v2/users/:id`.
- Public profile lookup via `/v2/users`, `/v2/users/:id`, and related endpoints.
- Project progress via `projects_users`, `teams`, `scale_teams`, and project endpoints.
- Location history and live location via `locations` and embedded user fields.
- Events, exams, and campus data via `events`, `events_users`, `exams`, `campus`, and `cursus`.
- Coalition, achievement, title, group, expertise, and skill data from user payloads and related endpoints.

Redirect to official 42 pages for:

- Evaluation execution if the current token/app lacks the required role/scope.
- Administrative or privileged mutations.
- Any flow where the API behavior is ambiguous or not exposed enough to reproduce safely.
- Sensitive account/profile changes.
- Anything that returns `403 Forbidden` because of insufficient scopes or app roles.

## Important API Facts

The 42 API is REST/JSON over HTTPS at:

```text
https://api.intra.42.fr/v2
```

Authentication is OAuth2. User-owned actions need a resource-owner token. Client secret must stay server-side.

Useful docs:

- API reference: https://api.intra.42.fr/apidoc/2.0.html
- API specification: https://api.intra.42.fr/apidoc/guides/specification
- Getting started: https://api.intra.42.fr/apidoc/guides/getting_started
- Users: https://api.intra.42.fr/apidoc/2.0/users.html
- Projects users: https://api.intra.42.fr/apidoc/2.0/projects_users.html
- Teams: https://api.intra.42.fr/apidoc/2.0/teams.html
- Scale teams: https://api.intra.42.fr/apidoc/2.0/scale_teams.html
- Slots: https://api.intra.42.fr/apidoc/2.0/slots.html
- Feedbacks: https://api.intra.42.fr/apidoc/2.0/feedbacks.html

Default API limits:

- `2 requests/second`
- `1200 requests/hour`
- Index endpoints are paginated, usually 30 results by default and up to 100 with `page[size]` or `per_page`.

The app should aggressively use caching, pagination, request deduplication, and narrow queries.

## Can Evaluations Be Done From The API?

Short answer: partially yes, but not as a normal public app feature unless the user/app has enough privileges. The safest MVP behavior is to display evaluation state in our client and redirect to official 42 for the actual evaluation workflow.

What is exposed:

- `GET /v2/me/scale_teams`
- `GET /v2/me/scale_teams/as_corrector`
- `GET /v2/me/scale_teams/as_corrected`
- `GET /v2/users/:user_id/scale_teams`
- `GET /v2/scale_teams/:id`
- `GET /v2/scale_teams`
- `POST /v2/scale_teams`
- `PATCH/PUT /v2/scale_teams/:id`
- `DELETE /v2/scale_teams/:id`
- `POST /v2/scale_teams/multiple_create`
- `GET/POST/PATCH/DELETE /v2/scale_teams/:scale_team_id/feedbacks`
- `GET /v2/scales/:id` and related scale endpoints, but these are restricted.

Important details from the docs:

- A scale team is "a defence of a team (on a project), involving an evaluator."
- Creating/updating scale teams requires a token resource owner scoped on `projects` with enough privileges, or an application role such as `Advanced tutor`.
- `POST /v2/scale_teams` sets the evaluator as the token's user.
- `PATCH/PUT /v2/scale_teams/:id` can update `comment`, `flag_id`, `truant_id`, and `answers_attributes`.
- The `scale_team.final_mark` is calculated automatically from answer values. The docs say that if the goal is to patch a student's project mark, patching `team.final_mark` is the right path, while changing the scale team mark itself means patching `answers_attributes`.
- `POST /v2/scale_teams/multiple_create` requires the `Advanced tutor` role and the `projects` scope.
- Feedback creation for a scale team requires a resource owner scoped on `projects` with enough privileges or a `Basic staff` role.

Practical conclusion:

- We can show upcoming, past, pending, corrected, and corrector-side evaluations.
- We can show scale team details, final mark, correction time, corrector/corrected users, flags, feedback, and filled status where returned.
- We can likely create availability slots for the current user only if the token has the right `projects` scope and 42 permits it.
- We should not ship "perform an evaluation here" as a default feature until it is tested with real school permissions and approved scopes.
- For the first production-quality version, evaluation cards should have an "Open on 42" action for filling, validating, or changing marks.

## Redirect Policy

Implement a single helper for official redirects:

```ts
type OfficialRedirectReason =
  | "missing_api"
  | "insufficient_scope"
  | "privileged_role_required"
  | "sensitive_action"
  | "unverified_workflow"
  | "api_error";
```

For every redirect:

- Preserve the user's intent in the UI.
- Explain briefly why the official site is being opened.
- Prefer opening a specific official page if the URL pattern is known and verified.
- Fall back to the user's official profile or dashboard if the exact page is unknown.
- Log the API endpoint, response status, and reason locally for debugging.

Suggested fallback targets:

- User profile: official user profile page for the login, once URL pattern is verified.
- Evaluation/scale team: official evaluation page, once URL pattern is verified.
- Project/team: official project/team page, once URL pattern is verified.
- Generic fallback: `https://profile.42.fr/`

Do not guess official URL patterns in critical flows. Add verified URL mappings as a separate task.

## Feature Feasibility Matrix

| Area | API feasibility | MVP behavior | Redirect needed? |
| --- | --- | --- | --- |
| Login | High | OAuth2 Authorization Code flow | No |
| Own profile | High | `/v2/me` dashboard | No |
| Public student profile | High | `/v2/users/:login` | No |
| User search | High | `/v2/users` with filters/sort/page | No |
| Cursus/level/skills | High | Read from user payload and cursus endpoints | No |
| Achievements/titles | High | Read from user payload and related endpoints | No |
| Coalitions | High | Read coalition user data and coalition endpoints | No |
| Project progress | High | Use `projects_users`, `teams`, status/final marks | No |
| Project registration | Medium/privileged | Show eligibility; redirect for real registration until tested | Usually |
| Project retry | Medium/privileged | Show retry date/state; redirect or guarded mutation | Usually |
| Team creation/editing | Medium/privileged | Read teams first; mutations behind capability checks | Often |
| Evaluation list | High | Read `scale_teams` as corrector/corrected | No |
| Evaluation execution | Low/privileged | Display info; redirect to official fill flow | Yes |
| Feedback on eval/event | Medium/privileged | Read feedback; write only after confirmed scope/role | Often |
| Slots | Medium/privileged | Read slots; maybe create own slots after permission testing | Often |
| Events | High | Browse events and attendance | No for read |
| Event registration | Medium | Use `events_users` only after scope testing | Maybe |
| Exams | Medium | Read exam data where available | Maybe |
| Locations | High | Live location/history/stats | No |
| Account settings | Low/privileged/sensitive | Redirect | Yes |
| Admin/staff tools | Low/privileged | Out of scope | Yes |

## Existing App Starting Point

This repo already has a good base:

- Bun static server in `src/index.ts`.
- React frontend in `src/frontend.tsx` and `src/App.tsx`.
- OAuth context in `src/context/AuthContext.tsx`.
- API hook and proxy path handling in `src/hooks/use42API.ts`.
- Core 42 types in `src/types.ts`.
- Existing pages for dashboard, profile, students, locations, and setup.

Current OAuth scope is only:

```text
public
```

For project/evaluation/slot mutations, this will not be enough. The app should support requesting additional scopes only when needed, not all at once.

## Proposed App IA

Main navigation:

- Dashboard
- Profile
- Projects
- Evaluations
- Slots
- Events
- Locations
- Students
- Settings

Profile pages:

- Header: avatar, login, display name, campus, coalition, title, correction points, wallet, location.
- Cursus progress: active cursus, level, grade, blackhole date.
- Skills: radar/list.
- Projects: active, waiting for correction, finished, failed/retry.
- Achievements and titles.
- Coalition and campus membership.
- Activity: locations, events, evaluations.

Dashboard:

- Current user summary from `/v2/me`.
- Active projects and deadlines.
- Upcoming evaluations as corrector.
- Pending evaluations as corrected.
- Available/recent slots.
- Current campus presence.
- Upcoming events/exams.

Projects:

- Project user state from `/v2/users/:id/projects_users`.
- Active team details from `/v2/teams/:id`.
- Attempts from `projects_user.occurrence` and teams list where available.
- Child project handling for piscines/rushes.
- Official redirect for registration/retry/team mutation until proven.

Evaluations:

- `/v2/me/scale_teams/as_corrector`
- `/v2/me/scale_teams/as_corrected`
- `/v2/scale_teams/:id`
- Display:
  - begin time
  - status: future, pending, filled, missed/truant, cancelled/unknown
  - project/team
  - corrector and corrected users
  - scale name
  - final mark
  - feedback rating/comment where available
  - `filled_at`
- Actions:
  - View details in app.
  - Open official evaluation page.
  - Create/update/fill only behind a feature flag after permission tests.

Slots:

- `/v2/me/slots`
- `/v2/users/:user_id/slots`
- `/v2/projects/:project_id/slots`
- Read slots by default.
- Creating slots needs resource owner and enough privileges. Non-advanced tutor users cannot set arbitrary `user_id` or `scale_team_id`.
- Treat slot creation as experimental until validated with a real account and `projects` scope.

Events:

- Read events and event registrations.
- Use `events_users` for registration/cancellation only after verifying scopes.
- Redirect to official event page on `403`, ambiguous event states, or attendance-critical actions.

Locations:

- `/v2/users/:id/locations`
- `/v2/users/:id/locations_stats`
- `/v2/locations`
- Current location is often embedded in `/v2/me` and `/v2/users/:id`.
- Build campus filtering and history pagination.

## Data And API Layer Plan

Add a typed API client layer above `fetch42`:

- `getMe()`
- `getUser(loginOrId)`
- `searchUsers(params)`
- `getUserProjects(userId)`
- `getTeam(teamId)`
- `getMyScaleTeams(kind)`
- `getScaleTeam(id)`
- `getMySlots()`
- `getUserLocations(userId)`
- `getEvents(params)`
- `getEventUsers(eventId)`

Use query keys that include:

- endpoint path
- params
- current token/user id
- selected campus/cursus

Error handling:

- `401`: token expired, log out or refresh if refresh support is added.
- `403`: show missing permission message and official redirect.
- `404`: show not found.
- `422`: show validation errors for any future mutation.
- `429`: back off, show rate limit state, retry later.

Caching:

- Profile data: 30-120 seconds.
- Search results: 30 seconds.
- Static-ish refs such as campus/cursus/projects: 1 hour or persistent cache.
- Evaluations/slots: 15-30 seconds.
- Locations: 15-30 seconds.

## OAuth And Scopes

Keep least-privilege as the rule.

Base scope:

```text
public
```

Potential future scopes:

- `projects` for project, slot, scale team, and evaluation-related mutations.
- `forum` only if forum features are added.

The app should:

- Show which scopes are active via `/oauth/token/info`.
- Request elevated scopes only when a user enables a feature.
- Treat app roles separately from scopes. A user can consent to a scope and still be blocked because the app lacks `Advanced tutor`, `Basic staff`, or another role.

## Implementation Phases

### Phase 1: Solid Read-Only Client

- Improve routing and layout for Dashboard/Profile/Students/Locations.
- Add typed API client functions.
- Add `/me` dashboard cards.
- Add public user profile pages.
- Add project progress section.
- Add evaluation list section using read-only `scale_teams`.
- Add official redirect helper and fallback buttons.
- Add clear permission/error UI for `403`, `401`, and rate limits.

### Phase 2: Rich Profile Replacement

- Project timeline and active-team details.
- Skill and level visualizations.
- Achievements/titles/coalitions sections.
- Campus/cursus filters.
- Location history and stats.
- Event and exam overview.
- Better search filters: campus, pool year/month, cursus, coalition if possible.

### Phase 3: Workflow Bridges

- Verify official URL mappings.
- Add "Open on 42" links for:
  - profile
  - project
  - team
  - evaluation
  - event
  - settings
- Add redirect reason tracking.
- Add feature flags for mutation experiments.

### Phase 4: Carefully Tested Mutations

Only after testing with real permissions:

- Event registration/cancellation.
- Own slot creation/deletion.
- Project registration/retry.
- Team creation/editing.

Keep evaluation filling out of default scope unless 42 permissions and behavior are fully validated.

### Phase 5: Optional Power Features

- Compare users/projects.
- Campus live map/list.
- Evaluation calendar.
- Personal progress analytics.
- Export profile/progress summary.
- Offline cache for recent profile pages.

## Redirect-First Special Cases

Always redirect instead of trying to clone:

- Account/security/profile settings.
- Any staff/admin action.
- Any write action returning `403`.
- Any evaluation fill/submit action before explicit validation.
- Any flow with legal/academic consequences where the official platform may include required confirmations.
- Any action where the API response does not expose enough state to make a safe UI.

## Testing Plan

API/client tests:

- Bracket query param conversion: `filter.campus_id` -> `filter[campus_id]`.
- Pagination header parsing.
- `403` official redirect handling.
- Token expiry and missing token handling.
- Typed parsing for optional/null API fields.

UI tests:

- Logged-out setup flow.
- Logged-in dashboard.
- User profile lookup.
- Project states:
  - not registered
  - searching group
  - creating group
  - in progress
  - waiting for correction
  - finished
  - retry available
- Evaluation states:
  - upcoming as corrector
  - pending as corrected
  - filled
  - missing feedback/final mark
  - insufficient permission redirect

Manual verification:

- Real OAuth callback locally and deployed.
- Real `/v2/me` payload.
- Rate limit behavior under dashboard load.
- Official redirect URLs.
- Scope upgrade UX.

## Open Questions

- What are the exact current official URL patterns for user, project, team, event, and evaluation pages on `profile.42.fr`?
- Which scopes can this app request and get approved for?
- Does a normal student token with `projects` scope allow useful slot creation in the current campus setup?
- Are scale team update/fill flows intentionally usable by peer evaluators through the public API, or effectively reserved for tutor/staff-style integrations?
- Are there campus-specific rules around evaluation slots, minimum duration, and booking windows that the client must read or infer?
- Should the app ever write academic state, or should it intentionally remain read-only plus redirects?

## Recommended Product Boundary

The best version of this project is not a perfect clone. It is a faster, clearer, friendlier profile and progress client that uses official redirects as escape hatches for sensitive workflows.

Build:

- Beautiful profile and project views.
- Great search.
- Clear evaluation and slot visibility.
- Good local caching.
- Honest permission handling.
- Deep links back to official 42.

Avoid, at least initially:

- Submitting evaluations.
- Editing marks.
- Admin/staff workflows.
- Sensitive account changes.
- Any workflow where being slightly wrong could hurt a student's academic state.
