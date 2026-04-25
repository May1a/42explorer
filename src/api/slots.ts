import { use42ApiQuery } from "./client";
import type { Params } from "../hooks/use42API";
import type { Slot } from "../types";

export function useMySlots(params?: Params) {
  return use42ApiQuery<Slot[]>("/me/slots", {
    "page.size": 100,
    sort: "-begin_at",
    ...params,
  });
}

export function useUserSlots(userId: number, params?: Params) {
  return use42ApiQuery<Slot[]>(`/users/${userId}/slots`, {
    "page.size": 50,
    sort: "-begin_at",
    ...params,
  });
}
