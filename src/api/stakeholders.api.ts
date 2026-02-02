import { request } from "./client";

export type Stakeholder = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// Admin endpoints
export async function adminListStakeholders() {
  return request<{ data: Stakeholder[] }>("/api/admin/stakeholders");
}

export async function adminCreateStakeholder(payload: { name: string }) {
  return request<{ data: Stakeholder }>("/api/admin/stakeholders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminPatchStakeholder(id: string, patch: Partial<Pick<Stakeholder, "name" | "isActive">>) {
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
