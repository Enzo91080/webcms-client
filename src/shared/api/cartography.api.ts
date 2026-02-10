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
