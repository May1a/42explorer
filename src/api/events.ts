import { use42ApiQuery } from "./client";
import type { Event } from "../types";
import type { Params } from "../hooks/use42API";

export function useEvents(params?: Params) {
  return use42ApiQuery<Event[]>("/events", {
    "page.size": 50,
    sort: "begin_at",
    ...params,
  });
}

export function useEvent(id: number) {
  return use42ApiQuery<Event>(`/events/${id}`);
}
