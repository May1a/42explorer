import { use42ApiQuery } from "./client";
import type { Params } from "../hooks/use42API";

export function useMySlots(params?: Params) {
  return use42ApiQuery<any[]>("/me/slots", {
    "page.size": 50,
    sort: "-begin_at",
    ...params,
  });
}

export function useUserSlots(userId: number, params?: Params) {
  return use42ApiQuery<any[]>(`/users/${userId}/slots`, {
    "page.size": 50,
    sort: "-begin_at",
    ...params,
  });
}
