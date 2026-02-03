import { request } from "./client";

export type ProcessRef = {
  id: string;
  code: string;
  name: string;
};

export type Pilot = {
  id: string;
  name: string;
  isActive: boolean;

  // Pour le form (Select multiple)
  processIds: string[];

  // Pour l'affichage (Tags "P02 — Vendre")
  processes?: ProcessRef[];

  createdAt?: string;
  updatedAt?: string;
};

// Admin endpoints
export async function adminListPilots() {
  return request<{ data: Pilot[] }>("/api/admin/pilots");
}

export async function adminCreatePilot(payload: { name: string }) {
  return request<{ data: Pilot }>("/api/admin/pilots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminPatchPilot(
  id: string,
  patch: Partial<Pick<Pilot, "name" | "isActive">>
) {
  return request<{ data: Pilot }>(`/api/admin/pilots/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function adminDeletePilot(id: string) {
  return request<{ data: { ok: true } }>(`/api/admin/pilots/${id}`, {
    method: "DELETE",
  });
}

export async function adminSetPilotProcesses(id: string, processIds: string[]) {
  return request<{
    data: {
      ok: true;
      processIds: string[];
      processes?: ProcessRef[];
    };
  }>(`/api/admin/pilots/${id}/processes`, {
    method: "PUT",
    body: JSON.stringify({ processIds }),
  });
}
