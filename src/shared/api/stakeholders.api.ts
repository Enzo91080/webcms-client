import { request } from "./client";
import type { StakeholderLinkFields } from "../types";

export type ProcessRef = {
  id: string;
  code: string;
  name: string;
};

export type ProcessWithLink = ProcessRef & {
  link?: StakeholderLinkFields;
};

export type Stakeholder = {
  id: string;
  name: string;
  isActive: boolean;

  // Relation (many-to-many) avec champs de lien
  processIds?: string[];           // pour le form (Select multiple)
  processes?: ProcessWithLink[];   // pour l'affichage avec champs de lien

  createdAt?: string;
  updatedAt?: string;
};

// Payloads
export type CreateStakeholderPayload = {
  name: string;
  isActive?: boolean;
};

export type PatchStakeholderPayload = Partial<CreateStakeholderPayload>;

// Payload pour les process d'un stakeholder avec leurs champs de lien
export type StakeholderProcessItem = {
  processId: string;
} & StakeholderLinkFields;

// Admin endpoints
export async function adminListStakeholders() {
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

/**
 * Sets the processes for a stakeholder with enriched link fields.
 * @param id - Stakeholder ID
 * @param items - Array of { processId, needs, expectations, ... }
 */
export async function adminSetStakeholderProcesses(
  id: string,
  items: StakeholderProcessItem[]
) {
  return request<{ data: { ok: true; count: number } }>(
    `/api/admin/stakeholders/${id}/processes`,
    {
      method: "PUT",
      body: JSON.stringify({ items }),
    }
  );
}
