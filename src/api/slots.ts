import { use42ApiQuery } from "./client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { API42Error } from "../lib/api-error";
import type { Params } from "../hooks/use42API";
import type { Slot } from "../types";

export function useMySlots(params?: Params, opts?: { enabled?: boolean }) {
  return use42ApiQuery<Slot[]>("/me/slots", {
    "page.size": 100,
    ...params,
  }, opts);
}

export function useUserSlots(userId: number, params?: Params) {
  return use42ApiQuery<Slot[]>(`/users/${userId}/slots`, {
    "page.size": 50,
    sort: "-begin_at",
    ...params,
  });
}

/* ── Mutations ─────────────────────────────────────────────────────────── */

async function slotMutate(
  method: "POST" | "DELETE",
  path: string,
  token: string,
  body?: BodyInit,
  contentType?: string
): Promise<Slot | void> {
  const url = new URL("/api/42", window.location.origin);
  url.searchParams.set("path", path);

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  if (contentType) headers.set("Content-Type", contentType);

  const res = await fetch(url.toString(), {
    method,
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new API42Error(res.status, text || res.statusText);
  }
  if (method === "DELETE") return;
  return (await res.json()) as Slot;
}

export function useCreateSlot() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<Slot, API42Error, { begin_at: string; end_at: string }>({
    mutationFn: (slot) => {
      if (!user?.id) {
        throw new API42Error(401, "Cannot create a slot before your 42 profile is loaded.");
      }
      const params = new URLSearchParams({
        "slot[user_id]": String(user.id),
        "slot[begin_at]": slot.begin_at,
        "slot[end_at]": slot.end_at,
      });
      return slotMutate("POST", "/slots", token!, params, "application/x-www-form-urlencoded") as Promise<Slot>;
    },
    onSuccess: () => {
      // short delay lets 42's eventually-consistent API settle before refetch
      setTimeout(() => qc.invalidateQueries({ queryKey: ["42", "/me/slots"] }), 300);
    },
  });
}

export function useDeleteSlot() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation<void, API42Error, number | number[]>({
    mutationFn: (ids) => {
      const list = Array.isArray(ids) ? ids : [ids];
      return Promise.all(list.map((id) => slotMutate("DELETE", `/slots/${id}`, token!))).then(() => undefined);
    },
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ["42", "/me/slots"] }), 300);
    },
  });
}

export function useUpdateSlot() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  return useMutation<Slot, API42Error, { slotIds: number[]; begin_at: string; end_at: string }>({
    mutationFn: async ({ slotIds, begin_at, end_at }) => {
      // delete all old 15-min chunks
      await Promise.all(slotIds.map((id) => slotMutate("DELETE", `/slots/${id}`, token!)));
      // create new slot with updated time range
      const params = new URLSearchParams({
        "slot[user_id]": String(user!.id),
        "slot[begin_at]": begin_at,
        "slot[end_at]": end_at,
      });
      return slotMutate("POST", "/slots", token!, params, "application/x-www-form-urlencoded") as Promise<Slot>;
    },
    onSuccess: () => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ["42", "/me/slots"] }), 300);
    },
  });
}
