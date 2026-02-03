import type { Node } from "reactflow";
import type { Guide } from "../ui/AlignmentGuides";

const SNAP_THRESHOLD = 8; // pixels

type NodeBounds = {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

/**
 * Get bounding box for a node
 */
function getNodeBounds(node: Node): NodeBounds {
  const width = (node.data as any)?.style?.width ?? node.width ?? 220;
  const height = (node.data as any)?.style?.height ?? node.height ?? 64;

  const left = node.position.x;
  const top = node.position.y;

  return {
    id: node.id,
    left,
    right: left + width,
    top,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    width,
    height,
  };
}

/**
 * Calculate alignment guides and snap position for a dragging node
 *
 * @param draggingNode The node being dragged
 * @param otherNodes Other nodes to check alignment against
 * @param threshold Snap threshold in pixels
 * @returns Guides to display and snap delta
 */
export function calculateGuides(
  draggingNode: Node,
  otherNodes: Node[],
  threshold: number = SNAP_THRESHOLD
): {
  guides: Guide[];
  snapDelta: { x: number; y: number };
} {
  const dragging = getNodeBounds(draggingNode);
  const others = otherNodes
    .filter((n) => n.id !== draggingNode.id)
    .map(getNodeBounds);

  if (others.length === 0) {
    return { guides: [], snapDelta: { x: 0, y: 0 } };
  }

  const guides: Guide[] = [];
  let snapX: number | null = null;
  let snapY: number | null = null;
  let bestDeltaX = Infinity;
  let bestDeltaY = Infinity;

  // Calculate canvas bounds for guide lines
  const allBounds = [dragging, ...others];
  const canvasMinY = Math.min(...allBounds.map((b) => b.top)) - 50;
  const canvasMaxY = Math.max(...allBounds.map((b) => b.bottom)) + 50;
  const canvasMinX = Math.min(...allBounds.map((b) => b.left)) - 50;
  const canvasMaxX = Math.max(...allBounds.map((b) => b.right)) + 50;

  for (const other of others) {
    // ─── Vertical alignment (X axis) ───────────────────────────────────

    // Left to left
    const deltaLeftLeft = Math.abs(dragging.left - other.left);
    if (deltaLeftLeft < threshold && deltaLeftLeft < bestDeltaX) {
      bestDeltaX = deltaLeftLeft;
      snapX = other.left - dragging.left + draggingNode.position.x;
    }

    // Right to right
    const deltaRightRight = Math.abs(dragging.right - other.right);
    if (deltaRightRight < threshold && deltaRightRight < bestDeltaX) {
      bestDeltaX = deltaRightRight;
      snapX = other.right - dragging.width - draggingNode.position.x + draggingNode.position.x;
      snapX = other.right - dragging.width;
    }

    // Center to center (X)
    const deltaCenterX = Math.abs(dragging.centerX - other.centerX);
    if (deltaCenterX < threshold && deltaCenterX < bestDeltaX) {
      bestDeltaX = deltaCenterX;
      snapX = other.centerX - dragging.width / 2;
    }

    // Left to right
    const deltaLeftRight = Math.abs(dragging.left - other.right);
    if (deltaLeftRight < threshold && deltaLeftRight < bestDeltaX) {
      bestDeltaX = deltaLeftRight;
      snapX = other.right;
    }

    // Right to left
    const deltaRightLeft = Math.abs(dragging.right - other.left);
    if (deltaRightLeft < threshold && deltaRightLeft < bestDeltaX) {
      bestDeltaX = deltaRightLeft;
      snapX = other.left - dragging.width;
    }

    // ─── Horizontal alignment (Y axis) ─────────────────────────────────

    // Top to top
    const deltaTopTop = Math.abs(dragging.top - other.top);
    if (deltaTopTop < threshold && deltaTopTop < bestDeltaY) {
      bestDeltaY = deltaTopTop;
      snapY = other.top;
    }

    // Bottom to bottom
    const deltaBottomBottom = Math.abs(dragging.bottom - other.bottom);
    if (deltaBottomBottom < threshold && deltaBottomBottom < bestDeltaY) {
      bestDeltaY = deltaBottomBottom;
      snapY = other.bottom - dragging.height;
    }

    // Center to center (Y)
    const deltaCenterY = Math.abs(dragging.centerY - other.centerY);
    if (deltaCenterY < threshold && deltaCenterY < bestDeltaY) {
      bestDeltaY = deltaCenterY;
      snapY = other.centerY - dragging.height / 2;
    }

    // Top to bottom
    const deltaTopBottom = Math.abs(dragging.top - other.bottom);
    if (deltaTopBottom < threshold && deltaTopBottom < bestDeltaY) {
      bestDeltaY = deltaTopBottom;
      snapY = other.bottom;
    }

    // Bottom to top
    const deltaBottomTop = Math.abs(dragging.bottom - other.top);
    if (deltaBottomTop < threshold && deltaBottomTop < bestDeltaY) {
      bestDeltaY = deltaBottomTop;
      snapY = other.top - dragging.height;
    }
  }

  // Generate guides for snap positions
  if (snapX !== null) {
    // Find which edge we're snapping to
    const snappedBounds = { ...dragging, left: snapX, right: snapX + dragging.width };

    // Check for left alignment
    const leftAligned = others.filter((o) => Math.abs(o.left - snappedBounds.left) < 1);
    if (leftAligned.length > 0) {
      guides.push({
        type: "vertical",
        position: snappedBounds.left,
        start: canvasMinY,
        end: canvasMaxY,
      });
    }

    // Check for right alignment
    const rightAligned = others.filter((o) => Math.abs(o.right - snappedBounds.right) < 1);
    if (rightAligned.length > 0) {
      guides.push({
        type: "vertical",
        position: snappedBounds.right,
        start: canvasMinY,
        end: canvasMaxY,
      });
    }

    // Check for center alignment
    const centerXAligned = others.filter(
      (o) => Math.abs(o.centerX - (snappedBounds.left + dragging.width / 2)) < 1
    );
    if (centerXAligned.length > 0) {
      guides.push({
        type: "vertical",
        position: snappedBounds.left + dragging.width / 2,
        start: canvasMinY,
        end: canvasMaxY,
      });
    }
  }

  if (snapY !== null) {
    const snappedBounds = { ...dragging, top: snapY, bottom: snapY + dragging.height };

    // Check for top alignment
    const topAligned = others.filter((o) => Math.abs(o.top - snappedBounds.top) < 1);
    if (topAligned.length > 0) {
      guides.push({
        type: "horizontal",
        position: snappedBounds.top,
        start: canvasMinX,
        end: canvasMaxX,
      });
    }

    // Check for bottom alignment
    const bottomAligned = others.filter((o) => Math.abs(o.bottom - snappedBounds.bottom) < 1);
    if (bottomAligned.length > 0) {
      guides.push({
        type: "horizontal",
        position: snappedBounds.bottom,
        start: canvasMinX,
        end: canvasMaxX,
      });
    }

    // Check for center alignment
    const centerYAligned = others.filter(
      (o) => Math.abs(o.centerY - (snappedBounds.top + dragging.height / 2)) < 1
    );
    if (centerYAligned.length > 0) {
      guides.push({
        type: "horizontal",
        position: snappedBounds.top + dragging.height / 2,
        start: canvasMinX,
        end: canvasMaxX,
      });
    }
  }

  // Calculate snap delta
  const snapDelta = {
    x: snapX !== null ? snapX - draggingNode.position.x : 0,
    y: snapY !== null ? snapY - draggingNode.position.y : 0,
  };

  return { guides, snapDelta };
}
