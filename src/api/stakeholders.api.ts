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

  // Relation (many-to-many)
  processIds?: string[];       // pour le form (Select multiple)
  processes?: ProcessRef[];    // pour l'affichage (Tags "P02 — Vendre")

  // New fields (English) — free text
  needs?: string | null;
  expectations?: string | null;
  evaluationCriteria?: string | null;
  requirements?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  opportunities?: string | null;
  risks?: string | null;
  actionPlan?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

// Payloads (clean & token-friendly)
export type CreateStakeholderPayload = {
  name: string;
  isActive?: boolean;

  needs?: string | null;
  expectations?: string | null;
  evaluationCriteria?: string | null;
  requirements?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  opportunities?: string | null;
  risks?: string | null;
  actionPlan?: string | null;
};

export type PatchStakeholderPayload = Partial<CreateStakeholderPayload>;

// Admin endpoints
export async function adminListStakeholders() {
  // back should return data: Stakeholder[] with processIds and/or processes
  return request<{ data: Stakeholder[] }>("/api/admin/stakeholders");
}

export async function adminCreateStakeholder(payload: CreateStakeholderPayload) {
  return request<{ data: Stakeholder }>("/api/admin/stakeholders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminPatchStakeholder(id: string, patch: PatchStakeholderPayload) {
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
