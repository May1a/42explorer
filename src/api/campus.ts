import { apiFetch, use42ApiQuery } from "./client";
import type { Campus, Location, Event } from "../types";
import type { Params } from "../hooks/use42API";

export function useCampuses(params?: Params) {
  return use42ApiQuery<Campus[]>("/campus", params, { staleTime: 3600_000 });
}

export function useCampusLocations(campusId: number, params?: Params) {
  return use42ApiQuery<Location[]>(`/campus/${campusId}/locations`, params);
}

export function useCampusEvents(campusId: number, params?: Params) {
  return use42ApiQuery<Event[]>(`/campus/${campusId}/events`, params);
}
