import type { SipocRow } from "../../../../../shared/types";

/**
 * Generate a unique edge ID
 */
export function uniqueEdgeId(source: string, target: string): string {
  return `e-${source}-${target}-${Date.now()}`;
}

/**
 * Extract a safe ID from a SIPOC row
 */
export function safeIdFromRow(row: SipocRow, fallback: string): string {
  const id = String(row?.ref || "").trim();
  return id || fallback;
}

/**
 * Check if an edge already exists between two nodes
 */
export function hasEdge(
  edges: { source: string; target: string }[],
  source: string,
  target: string
): boolean {
  return edges.some((e) => e.source === source && e.target === target);
}
