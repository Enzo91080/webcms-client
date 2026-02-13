import type { Node } from "reactflow";

/**
 * Bring selected nodes to front (highest zIndex)
 */
export function bringToFront<T>(nodes: Node<T>[], selectedIds: Set<string>): Node<T>[] {
  const maxZ = Math.max(0, ...nodes.map((n) => n.zIndex || 0));
  return nodes.map((n) =>
    selectedIds.has(n.id) ? { ...n, zIndex: maxZ + 1 } : n
  );
}

/**
 * Send selected nodes to back (lowest zIndex)
 */
export function sendToBack<T>(nodes: Node<T>[], selectedIds: Set<string>): Node<T>[] {
  const minZ = Math.min(0, ...nodes.map((n) => n.zIndex || 0));
  return nodes.map((n) =>
    selectedIds.has(n.id) ? { ...n, zIndex: minZ - 1 } : n
  );
}

/**
 * Move selected nodes one step forward
 */
export function bringForward<T>(nodes: Node<T>[], selectedIds: Set<string>): Node<T>[] {
  return nodes.map((n) =>
    selectedIds.has(n.id) ? { ...n, zIndex: (n.zIndex || 0) + 1 } : n
  );
}

/**
 * Move selected nodes one step backward
 */
export function sendBackward<T>(nodes: Node<T>[], selectedIds: Set<string>): Node<T>[] {
  return nodes.map((n) =>
    selectedIds.has(n.id) ? { ...n, zIndex: (n.zIndex || 0) - 1 } : n
  );
}
