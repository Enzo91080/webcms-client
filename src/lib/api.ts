import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...init,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.message || payload?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export type ProcessLite = {
  id: string;
  code: string;
  name: string;
  title?: string;
  orderInParent: number;
  isActive: boolean;
};

export type Designation = { name: string; url: string };
export type SipocRow = {
  ref?: string;
  processusFournisseur?: string;
  entrees?: string;
  numero?: string;
  ressources?: string;
  designation: Designation;
  sorties?: string;
  processusClient?: string;
};

export type LogiNode = {
  id: string;
  shape: "rectangle" | "diamond" | "circle" | "diamond-x";
  label: string;
  position?: { x: number; y: number };
  sipocRef?: string;
  style?: {
    fill?: string;
    stroke?: string;
    text?: string;
    width?: number;
    height?: number;
    fontSize?: number;
  };

  interaction?: {
    action: "navigate" | "open" | "tooltip";
    targetType: "process" | "url";
    targetProcessId?: string;
    targetUrl?: string;
    tooltip?: string;
  } | null;
};

export type LogiEdge = { id: string; from: string; to: string; label?: string; color?: string; width?: number; badgeText?: string; badgeColor?: string; badgeBg?: string; kind?: "orthogonal" | "step" | "smooth"; };

export type ProcessFull = ProcessLite & {
  parentProcessId: string | null;
  objectives?: string;
  stakeholders?: any;
  referenceDocuments?: any;
  sipoc?: { rows: SipocRow[] };
  logigramme?: { entryNodeId?: string; nodes: LogiNode[]; edges: LogiEdge[]; legend?: any[] };
  children?: ProcessLite[];
};

export type PathItem = {
  id: string;
  code: string;
  name: string;
  parentProcessId: string | null;
  orderInParent: number;
};

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
  return request<{ data: any }>(`/api/processes/${processId}/sipoc`, {
    method: "PUT",
    body: JSON.stringify({ sipoc: { rows } }),
  });
}

export async function saveLogigramme(processId: string, logigramme: any) {
  return request<{ data: any }>(`/api/processes/${processId}/logigramme`, {
    method: "PUT",
    body: JSON.stringify({ logigramme }),
  });
}


export async function login(email: string, password: string) {
  return request<{ data: { token: string; user: any } }>(`/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function me() {
  return request<{ data: { user: any } }>(`/api/auth/me`);
}

// Admin
export async function adminListProcesses() {
  return request<{ data: any[] }>(`/api/admin/processes`);
}

export async function adminGetProcess(id: string) {
  return request<{ data: any }>(`/api/admin/processes/${id}`);
}

export async function adminCreateProcess(payload: any) {
  return request<{ data: any }>(`/api/admin/processes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminPatchProcess(id: string, patch: any) {
  return request<{ data: any }>(`/api/admin/processes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function adminDeleteProcess(id: string) {
  return request<{ data: any }>(`/api/admin/processes/${id}`, {
    method: "DELETE",
  });
}
