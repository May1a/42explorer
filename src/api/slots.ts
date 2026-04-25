import { use42ApiQuery } from "./client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { API42Error } from "../lib/api-error";
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

/* ── Mutations ─────────────────────────────────────────────────────────── */

async function slotMutate(
  method: "POST" | "DELETE",
  path: string,
  token: string,
  body?: unknown
): Promise<Slot | void> {
  const url = new URL("/api/42", window.location.origin);
  url.searchParams.set("path", path);

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new API42Error(res.status, text || res.statusText);
  }
  if (method === "DELETE") return;
  return (await res.json()) as Slot;
}

export function useCreateSlot() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation<Slot, API42Error, { begin_at: string; end_at: string }>({
    mutationFn: (slot) => slotMutate("POST", "/slots", token!, { slot }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["42", "/me/slots"] }),
  });
}

export function useDeleteSlot() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation<void, API42Error, number>({
    mutationFn: (id) => slotMutate("DELETE", `/slots/${id}`, token!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["42", "/me/slots"] }),
  });
}
