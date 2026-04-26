import { apiFetch, use42ApiQuery } from "./client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { API42Error } from "../lib/api-error";
import type { FortyTwoUser } from "../types";
import type { API42Result } from "../hooks/use42API";

export function getMe(token?: string): Promise<API42Result<FortyTwoUser>> {
  return apiFetch<FortyTwoUser>("/me", undefined, token);
}

export function useMe() {
  return use42ApiQuery<FortyTwoUser>("/me", undefined, { staleTime: 60_000 });
}

async function updateProfilePicture(
  token: string,
  userId: number,
  image: File,
): Promise<void> {
  const url = new URL("/api/42", window.location.origin);
  url.searchParams.set("path", `/users/${userId}`);

  const body = new FormData();
  body.set("user[image]", image);

  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new API42Error(res.status, text || res.statusText);
  }
}

export function useUpdateProfilePicture() {
  const { token, user, refreshUser } = useAuth();
  const qc = useQueryClient();

  return useMutation<void, API42Error, File>({
    mutationFn: (image) => {
      if (!token) throw new API42Error(401, "Not authenticated.");
      if (!user?.id) throw new API42Error(401, "Profile not loaded.");
      return updateProfilePicture(token, user.id, image);
    },
    onSuccess: async () => {
      await Promise.all([
        refreshUser(),
        qc.invalidateQueries({ queryKey: ["42", "/me"] }),
      ]);
    },
  });
}
