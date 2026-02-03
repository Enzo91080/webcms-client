import { request } from "./client";

export type ProcessRef = {
  id: string;
  code: string;
  name: string;
};

export type Stakeholder = {
  id: string;
  name: string;
  isActive: boolean;

  // ✅ Pour le form (Select multiple)
  processIds: string[];

  // ✅ Pour l'affichage (Tags "P02 — Vendre")
  processes?: ProcessRef[];

  createdAt?: string;
  updatedAt?: string;
};

// Admin endpoints
export async function adminListStakeholders() {
  // ✅ Le back doit renvoyer data: Stakeholder[] avec processIds + processes
  return request<{ data: Stakeholder[] }>("/api/admin/stakeholders");
}

export async function adminCreateStakeholder(payload: { name: string }) {
  return request<{ data: Stakeholder }>("/api/admin/stakeholders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminPatchStakeholder(
  id: string,
  patch: Partial<Pick<Stakeholder, "name" | "isActive">>
) {
  return request<{ data: Stakeholder }>(`/api/admin/stakeholders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function adminDeleteStakeholder(id: string) {
  return request<{ data: { ok: true } }>(`/api/admin/stakeholders/${id}`, {
    method: "DELETE",
  });
}

export async function adminSetStakeholderProcesses(id: string, processIds: string[]) {
  // ✅ Idéalement le back renvoie la liste mise à jour
  // (au minimum ok + processIds; si tu peux, ajoute aussi processes)
  return request<{
    data: {
      ok: true;
      processIds: string[];
      processes?: ProcessRef[];
    };
  }>(`/api/admin/stakeholders/${id}/processes`, {
    method: "PUT",
    body: JSON.stringify({ processIds }),
  });
}
