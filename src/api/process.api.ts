import type { PathItem, ProcessFull, ProcessLite, SipocRow, LogiNode, LogiEdge, LegendItem, StakeholderLinkFields } from "../types";
import { request } from "./client";

// Payload pour les stakeholders d'un process avec leurs champs de lien
export type ProcessStakeholderItem = {
  stakeholderId: string;
} & StakeholderLinkFields;

export async function getCartography() {
  return request<{ data: ProcessLite[] }>("/api/processes/cartography");
}

export async function getProcessByCode(code: string) {
  return request<{ data: ProcessFull }>(`/api/processes/by-code/${encodeURIComponent(code)}`);
}

export async function getPath(processId: string) {
  return request<{ data: PathItem[] }>(`/api/processes/${processId}/path`);
}

export async function resolveCodes(ids: string[]) {
  return request<{ data: Record<string, { code: string; name: string }> }>(
    "/api/processes/resolve-codes",
    { method: "POST", body: JSON.stringify({ ids }) }
  );
}

export async function resolveIdByCode(code: string) {
  return request<{ data: { id: string; code: string; name: string } }>(
    `/api/processes/resolve-id/${encodeURIComponent(code)}`
  );
}

export async function saveSipoc(processId: string, rows: SipocRow[]) {
  return request<{ data: { rows: SipocRow[] } }>(`/api/processes/${processId}/sipoc`, {
    method: "PUT",
    body: JSON.stringify({ sipoc: { rows } }),
  });
}

export async function saveLogigramme(processId: string, logigramme: { entryNodeId?: string; nodes: LogiNode[]; edges: LogiEdge[]; legend?: LegendItem[] }) {
  return request<{ data: { entryNodeId?: string; nodes: LogiNode[]; edges: LogiEdge[]; legend?: LegendItem[] } }>(`/api/processes/${processId}/logigramme`, {
    method: "PUT",
    body: JSON.stringify({ logigramme }),
  });
}

// Admin endpoints
export async function adminListProcesses() {
  return request<{ data: ProcessFull[] }>(`/api/admin/processes`);
}

export async function adminGetProcess(id: string) {
  return request<{ data: ProcessFull }>(`/api/admin/processes/${id}`);
}

export async function adminCreateProcess(payload: Partial<ProcessFull>) {
  return request<{ data: ProcessFull }>(`/api/admin/processes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminPatchProcess(id: string, patch: Partial<ProcessFull>) {
  return request<{ data: ProcessFull }>(`/api/admin/processes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function adminDeleteProcess(id: string) {
  return request<{ data: ProcessFull }>(`/api/admin/processes/${id}`, {
    method: "DELETE",
  });
}

export async function adminSetProcessPilots(processId: string, pilotIds: string[]) {
  return request<{ data: { ok: true; pilotIds: string[] } }>(
    `/api/admin/processes/${processId}/pilots`,
    {
      method: "PUT",
      body: JSON.stringify({ pilotIds }),
    }
  );
}

export async function adminSetProcessStakeholders(
  processId: string,
  items: ProcessStakeholderItem[]
) {
  return request<{ data: { ok: true; count: number } }>(
    `/api/admin/processes/${processId}/stakeholders`,
    {
      method: "PUT",
      body: JSON.stringify({ items }),
    }
  );
}
