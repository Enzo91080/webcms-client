import type { Node } from "reactflow";

/**
 * Get node bounding box
 */
function getNodeBounds(node: Node): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
} {
  const width = (node.data as any)?.style?.width ?? node.width ?? 220;
  const height = (node.data as any)?.style?.height ?? node.height ?? 64;

  const left = node.position.x;
  const top = node.position.y;
  const right = left + width;
  const bottom = top + height;

  return {
    left,
    right,
    top,
    bottom,
    centerX: left + width / 2,
    centerY: top + height / 2,
    width,
    height,
  };
}

/**
 * Snap value to grid
 */
function snapToGrid(value: number, gridSize: number = 10): number {
  return Math.round(value / gridSize) * gridSize;
}

// ─── Alignment Commands ────────────────────────────────────────────────────

export type AlignDirection = "left" | "center" | "right" | "top" | "middle" | "bottom";

/**
 * Align selected nodes
 *
 * @param nodes All nodes
 * @param selectedIds IDs of selected nodes
 * @param direction Alignment direction
 * @param snap Snap to grid
 * @param gridSize Grid size for snapping
 */
export function alignNodes<N extends Node>(
  nodes: N[],
  selectedIds: Set<string>,
  direction: AlignDirection,
  snap: boolean = true,
  gridSize: number = 10
): N[] {
  const selectedNodes = nodes.filter((n) => selectedIds.has(n.id));
  if (selectedNodes.length < 2) return nodes;

  const bounds = selectedNodes.map(getNodeBounds);

  let targetValue: number;

  switch (direction) {
    case "left":
      targetValue = Math.min(...bounds.map((b) => b.left));
      break;
    case "center":
      const minX = Math.min(...bounds.map((b) => b.left));
      const maxX = Math.max(...bounds.map((b) => b.right));
      targetValue = (minX + maxX) / 2;
      break;
    case "right":
      targetValue = Math.max(...bounds.map((b) => b.right));
      break;
    case "top":
      targetValue = Math.min(...bounds.map((b) => b.top));
      break;
    case "middle":
      const minY = Math.min(...bounds.map((b) => b.top));
      const maxY = Math.max(...bounds.map((b) => b.bottom));
      targetValue = (minY + maxY) / 2;
      break;
    case "bottom":
      targetValue = Math.max(...bounds.map((b) => b.bottom));
      break;
  }

  if (snap) {
    targetValue = snapToGrid(targetValue, gridSize);
  }

  return nodes.map((node) => {
    if (!selectedIds.has(node.id)) return node;

    const nodeBounds = getNodeBounds(node);
    let newX = node.position.x;
    let newY = node.position.y;

    switch (direction) {
      case "left":
        newX = targetValue;
        break;
      case "center":
        newX = targetValue - nodeBounds.width / 2;
        break;
      case "right":
        newX = targetValue - nodeBounds.width;
        break;
      case "top":
        newY = targetValue;
        break;
      case "middle":
        newY = targetValue - nodeBounds.height / 2;
        break;
      case "bottom":
        newY = targetValue - nodeBounds.height;
        break;
    }

    if (snap) {
      newX = snapToGrid(newX, gridSize);
      newY = snapToGrid(newY, gridSize);
    }

    return {
      ...node,
      position: { x: newX, y: newY },
    };
  });
}

// ─── Distribution Commands ─────────────────────────────────────────────────

export type DistributeDirection = "horizontal" | "vertical";

/**
 * Distribute selected nodes evenly
 *
 * @param nodes All nodes
 * @param selectedIds IDs of selected nodes
 * @param direction Distribution direction
 * @param snap Snap to grid
 * @param gridSize Grid size for snapping
 */
export function distributeNodes<N extends Node>(
  nodes: N[],
  selectedIds: Set<string>,
  direction: DistributeDirection,
  snap: boolean = true,
  gridSize: number = 10
): N[] {
  const selectedNodes = nodes.filter((n) => selectedIds.has(n.id));
  if (selectedNodes.length < 3) return nodes; // Need at least 3 nodes to distribute

  const bounds = selectedNodes.map((n) => ({ node: n, bounds: getNodeBounds(n) }));

  if (direction === "horizontal") {
    // Sort by center X
    bounds.sort((a, b) => a.bounds.centerX - b.bounds.centerX);

    const leftmost = bounds[0].bounds.centerX;
    const rightmost = bounds[bounds.length - 1].bounds.centerX;
    const totalSpace = rightmost - leftmost;
    const gap = totalSpace / (bounds.length - 1);

    const positionMap = new Map<string, { x: number; y: number }>();
    bounds.forEach((item, index) => {
      let newCenterX = leftmost + gap * index;
      let newX = newCenterX - item.bounds.width / 2;
      if (snap) newX = snapToGrid(newX, gridSize);
      positionMap.set(item.node.id, { x: newX, y: item.node.position.y });
    });

    return nodes.map((node) => {
      const newPos = positionMap.get(node.id);
      if (!newPos) return node;
      return { ...node, position: newPos };
    });
  } else {
    // Sort by center Y
    bounds.sort((a, b) => a.bounds.centerY - b.bounds.centerY);

    const topmost = bounds[0].bounds.centerY;
    const bottommost = bounds[bounds.length - 1].bounds.centerY;
    const totalSpace = bottommost - topmost;
    const gap = totalSpace / (bounds.length - 1);

    const positionMap = new Map<string, { x: number; y: number }>();
    bounds.forEach((item, index) => {
      let newCenterY = topmost + gap * index;
      let newY = newCenterY - item.bounds.height / 2;
      if (snap) newY = snapToGrid(newY, gridSize);
      positionMap.set(item.node.id, { x: item.node.position.x, y: newY });
    });

    return nodes.map((node) => {
      const newPos = positionMap.get(node.id);
      if (!newPos) return node;
      return { ...node, position: newPos };
    });
  }
}

// ─── Utility: Check if alignment/distribution is possible ─────────────────

export function canAlign(selectedCount: number): boolean {
  return selectedCount >= 2;
}

export function canDistribute(selectedCount: number): boolean {
  return selectedCount >= 3;
}
