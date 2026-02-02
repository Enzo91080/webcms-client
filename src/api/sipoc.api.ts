import type { SipocPhase } from "../types";
import { request } from "./client";

export type AdminSipocResponse = {
  processId: string;
  phases: SipocPhase[];
};

/**
 * GET /api/admin/processes/:processId/sipoc
 * Retrieves the SIPOC data for a process.
 */
export async function adminGetSipoc(processId: string) {
  return request<AdminSipocResponse>(`/api/admin/processes/${processId}/sipoc`);
}

/**
 * PUT /api/admin/processes/:processId/sipoc
 * Upserts the SIPOC data for a process (replaces all phases and rows).
 */
export async function adminUpsertSipoc(processId: string, payload: { phases: SipocPhase[] }) {
  return request<AdminSipocResponse>(`/api/admin/processes/${processId}/sipoc`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
