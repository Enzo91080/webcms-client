import type { Node } from "reactflow";
import type { SipocRow } from "../../../../types";
import type { ShapeNodeData } from "../model/types";
import { safeIdFromRow } from "./ids";

type LayoutOptions = {
  startX?: number;
  startY?: number;
  colWidth?: number;
  rowGap?: number;
};

/**
 * Generate grid positions for a list of node IDs
 */
export function gridLayout(
  ids: string[],
  options: LayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const { startX = 90, startY = 70, colWidth = 320, rowGap = 120 } = options;
  const cols = Math.max(3, Math.min(6, ids.length));
  const positions = new Map<string, { x: number; y: number }>();

  ids.forEach((id, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(id, {
      x: startX + col * colWidth,
      y: startY + row * rowGap,
    });
  });

  return positions;
}

/**
 * Apply grid layout to existing nodes (preserves data, updates positions)
 */
export function applyAutoLayout(nodes: Node<ShapeNodeData>[]): Node<ShapeNodeData>[] {
  const ids = nodes.map((n) => n.id);
  const layout = gridLayout(ids);

  return nodes.map((n) => ({
    ...n,
    position: layout.get(n.id) || n.position,
  }));
}

/**
 * Build nodes from SIPOC rows, preserving existing positions/styles
 */
export function buildFromSipoc(
  rows: SipocRow[],
  prevNodes: Node<ShapeNodeData>[] = []
): Node<ShapeNodeData>[] {
  const prevById = new Map(prevNodes.map((n) => [n.id, n]));
  const ids = rows.map((r, i) => safeIdFromRow(r, `S${i + 1}`));
  const layout = gridLayout(ids);

  return ids.map((id, i) => {
    const row = rows[i];
    const prev = prevById.get(id);
    const label = String(row?.designation?.name || id);

    const data: ShapeNodeData = {
      label,
      shape: prev?.data?.shape || "rectangle",
      sipocRef: id,
      style: prev?.data?.style || undefined,
      interaction: prev?.data?.interaction || null,
      isLinkSource: false,
    };

    const position = prev?.position || layout.get(id) || { x: 0, y: 0 };

    return { id, type: "shape", position, data };
  });
}
