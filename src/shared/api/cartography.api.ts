import type { CartographyItem, CartographySlot } from "../types";
import { request } from "./client";

export type CartographyLayoutInput = {
  slotKey: CartographySlot;
  slotOrder: number;
  processId: string;
  label?: string | null;
  isActive?: boolean;
};

export async function adminGetCartography(): Promise<{ data: CartographyItem[] }> {
  return request<{ data: CartographyItem[] }>("/api/admin/cartography");
}

export async function adminSaveCartography(
  items: CartographyLayoutInput[]
): Promise<{ data: CartographyItem[] }> {
  return request<{ data: CartographyItem[] }>("/api/admin/cartography", {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
}

// ── Panel stakeholders ──────────────────────────────

export type PanelStakeholderItem = {
  id: string;
  panelKey: "left_panel" | "right_panel";
  panelOrder: number;
  stakeholder: { id: string; name: string };
};

export type PanelStakeholderInput = {
  panelKey: "left_panel" | "right_panel";
  stakeholderId: string;
  panelOrder: number;
};

export type PanelConfig = {
  left_panel: "all" | "custom";
  right_panel: "all" | "custom";
};

type PanelStakeholdersResponse = {
  data: PanelStakeholderItem[];
  config: PanelConfig;
};

export async function adminGetPanelStakeholders() {
  return request<PanelStakeholdersResponse>("/api/admin/cartography/panels");
}

export async function adminSavePanelStakeholders(
  items: PanelStakeholderInput[],
  config: PanelConfig
) {
  return request<PanelStakeholdersResponse>("/api/admin/cartography/panels", {
    method: "PUT",
    body: JSON.stringify({ items, config }),
  });
}
