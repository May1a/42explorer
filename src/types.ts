// ── 42 API core types ──────────────────────────────────────────────────────

export interface ImageVersions {
  large: string;
  medium: string;
  small: string;
  micro: string;
}

export interface Language {
  id: number;
  name: string;
  identifier: string;
}

export interface Campus {
  id: number;
  name: string;
  time_zone: string;
  language: Language;
  users_count: number;
  vogsphere_id: number;
  country: string;
  address: string;
  zip: string;
  city: string;
  website: string;
  facebook: string;
  twitter: string;
  active: boolean;
  default_hidden_phone: boolean;
}

export interface CampusUser {
  id: number;
  user_id: number;
  campus_id: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cursus {
  id: number;
  created_at: string;
  name: string;
  slug: string;
  kind: string;
}

export interface Skill {
  id: number;
  name: string;
  level: number;
}

export interface CursusUser {
  id: number;
  begin_at: string;
  end_at: string | null;
  grade: string | null;
  level: number;
  skills: Skill[];
  cursus_id: number;
  has_coalition: boolean;
  blackholed_at: string | null;
  user: Partial<FortyTwoUser>;
  cursus: Cursus;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  exam: boolean;
}

export type ProjectStatus =
  | "finished"
  | "in_progress"
  | "searching_a_group"
  | "creating_group"
  | "waiting_for_correction"
  | "parent";

export interface ProjectUser {
  id: number;
  occurrence: number;
  final_mark: number | null;
  status: ProjectStatus;
  "validated?": boolean | null;
  current_team_id: number | null;
  project: Project;
  cursus_ids: number[];
  marked_at: string | null;
  marked: boolean;
  retriable_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AchievementTier = "easy" | "medium" | "hard" | "challenge" | "bonus";
export type AchievementKind =
  | "project"
  | "pedagogic"
  | "social"
  | "career"
  | "community"
  | "scolarity";

export interface Achievement {
  id: number;
  name: string;
  description: string;
  tier: AchievementTier;
  kind: AchievementKind;
  visible: boolean;
  image: string;
  nbr_of_success: number | null;
  users_url: string;
}

export interface Title {
  id: number;
  name: string;
}

export interface TitleUser {
  id: number;
  user_id: number;
  title_id: number;
  selected: boolean;
  created_at: string;
  updated_at: string;
}

export interface Coalition {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  cover_url: string;
  color: string;
  score: number;
  user_id: number;
}

export interface CoalitionUser {
  id: number;
  coalition_id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  score: number;
  rank: number;
  coalition: Coalition;
}

export interface ExpertiseUser {
  id: number;
  expertise_id: number;
  interested: boolean;
  value: number;
  contact_me: boolean;
  created_at: string;
  user_id: number;
}

export interface FortyTwoUser {
  id: number;
  login: string;
  url: string;
  email: string;
  first_name: string;
  last_name: string;
  displayname: string;
  kind: string;
  image: { link: string; versions: ImageVersions };
  "staff?": boolean;
  correction_point: number;
  pool_month: string;
  pool_year: string;
  location: string | null;
  wallet: number;
  alumni: boolean;
  active?: boolean;
  created_at: string;
  updated_at: string;
  campus: Campus[];
  campus_users: CampusUser[];
  cursus_users: CursusUser[];
  projects_users: ProjectUser[];
  achievements: Achievement[];
  titles: Title[];
  titles_users: TitleUser[];
  partnerships: any[];
  patroned: any[];
  patroning: any[];
  expertises_users: ExpertiseUser[];
  roles: any[];
  coalitions_users: CoalitionUser[];
}

export interface Slot {
  id: number;
  begin_at: string;
  end_at: string;
  user: Partial<FortyTwoUser>;
  scale_team: ScaleTeam | null;
}

export interface Location {
  id: number;
  begin_at: string;
  end_at: string | null;
  primary: boolean;
  host: string;
  campus_id: number;
  user: Partial<FortyTwoUser>;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  kind: string;
  max_people: number | null;
  nbr_subscribers: number;
  begin_at: string;
  end_at: string;
  campus_ids: number[];
  cursus_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface ScaleTeam {
  id: number;
  scale_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  feedback: string;
  final_mark: number | null;
  flag: {
    id: number;
    name: string;
    positive: boolean;
    icon: string;
  };
  begin_at: string;
  filled_at: string | null;
  correcteds: Partial<FortyTwoUser>[];
  corrector: Partial<FortyTwoUser> | string;
  team: {
    id: number;
    name: string;
    url: string;
    final_mark: number | null;
    project_id: number;
    created_at: string;
    updated_at: string;
    status: string;
    terminating_at: string | null;
    users: Partial<FortyTwoUser>[];
    "locked?": boolean;
    "validated?": boolean | null;
    "closed?": boolean;
    repo_url: string;
    repo_uuid: string;
    locked_at: string | null;
    closed_at: string | null;
    project_session_id: number;
    project_gitlab_path: string;
  };
  scale: {
    id: number;
    evaluation_id: number;
    name: string;
    is_primary: boolean;
    comment: string;
    introduction_md: string;
    disclaimer_md: string;
    guidelines_md: string;
    created_at: string;
    correction_number: number;
    duration: number;
    manual_subscription: boolean;
    languages: Language[];
    flags: any[];
    free: boolean;
  };
}

// ── App-level types ────────────────────────────────────────────────────────

export interface AuthState {
  authenticated: boolean;
  user: FortyTwoUser | null;
  loading: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
}

export type SortDir = "asc" | "desc";
