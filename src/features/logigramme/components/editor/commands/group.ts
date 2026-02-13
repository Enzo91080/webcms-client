import type { Node } from "reactflow";
import type { ShapeNodeData } from "../model/types";

/**
 * Group selected nodes under a new group node
 */
export function groupNodes(
  nodes: Node<ShapeNodeData>[],
  selectedIds: Set<string>,
): { nodes: Node<ShapeNodeData>[]; groupId: string } {
  if (selectedIds.size < 2) return { nodes, groupId: "" };

  const selected = nodes.filter((n) => selectedIds.has(n.id));
  const minX = Math.min(...selected.map((n) => n.position.x));
  const minY = Math.min(...selected.map((n) => n.position.y));
  const maxX = Math.max(...selected.map((n) => n.position.x + (n.width || 220)));
  const maxY = Math.max(...selected.map((n) => n.position.y + (n.height || 64)));

  const padding = 20;
  const groupId = `group-${Date.now()}`;

  const groupNode: Node<any> = {
    id: groupId,
    type: "group",
    position: { x: minX - padding, y: minY - padding },
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
    style: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 },
    data: { label: "Groupe", style: {} },
    zIndex: -1,
  };

  // Move selected nodes to be children (adjust positions to be relative to group)
  const updatedNodes = nodes.map((n) => {
    if (!selectedIds.has(n.id)) return n;
    return {
      ...n,
      parentNode: groupId,
      extent: "parent" as const,
      position: {
        x: n.position.x - (minX - padding),
        y: n.position.y - (minY - padding),
      },
    };
  });

  return {
    nodes: [groupNode, ...updatedNodes],
    groupId,
  };
}

/**
 * Ungroup nodes from their parent group
 */
export function ungroupNodes(
  nodes: Node<ShapeNodeData>[],
  selectedIds: Set<string>,
): Node<ShapeNodeData>[] {
  // Find group nodes in selection
  const groupIds = new Set<string>();
  for (const n of nodes) {
    if (selectedIds.has(n.id) && n.type === "group") {
      groupIds.add(n.id);
    }
  }

  if (groupIds.size === 0) {
    // If selection contains children of a group, ungroup those
    for (const n of nodes) {
      if (selectedIds.has(n.id) && (n as any).parentNode) {
        groupIds.add((n as any).parentNode);
      }
    }
  }

  if (groupIds.size === 0) return nodes;

  // Get group positions
  const groupPositions = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    if (groupIds.has(n.id)) {
      groupPositions.set(n.id, n.position);
    }
  }

  return nodes
    .filter((n) => !groupIds.has(n.id)) // Remove group nodes
    .map((n) => {
      const parentId = (n as any).parentNode;
      if (!parentId || !groupIds.has(parentId)) return n;
      const gp = groupPositions.get(parentId);
      if (!gp) return n;
      // Convert back to absolute position
      const result = { ...n };
      result.position = {
        x: n.position.x + gp.x,
        y: n.position.y + gp.y,
      };
      delete (result as any).parentNode;
      delete (result as any).extent;
      return result;
    });
}
