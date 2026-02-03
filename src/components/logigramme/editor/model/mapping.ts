import { MarkerType, Node, Edge } from "reactflow";
import type { StoredNode, StoredEdge, LegendItem, ShapeNodeData, OrthogonalEdgeData } from "./types";
import { DEFAULT_EDGE_COLOR, DEFAULT_EDGE_WIDTH } from "./defaults";

/**
 * Convert ReactFlow nodes/edges to stored format (for persistence)
 */
export function toStored(
  nodes: Node<ShapeNodeData>[],
  edges: Edge<OrthogonalEdgeData>[],
  legend: LegendItem[]
): { nodes: StoredNode[]; edges: StoredEdge[]; legend: LegendItem[] } {
  const storedNodes: StoredNode[] = nodes.map((n) => ({
    id: n.id,
    sipocRef: n.data?.sipocRef || n.id,
    shape: n.data?.shape || "rectangle",
    label: String(n.data?.label || n.id),
    position: n.position,
    style: n.data?.style || undefined,
    interaction: n.data?.interaction || null,
  }));

  const storedEdges: StoredEdge[] = edges.map((e, i) => ({
    id: e.id || `e${i + 1}`,
    from: String(e.source),
    to: String(e.target),
    label: String((e as any).label || ""),
    kind: (e.type || "orthogonal") as StoredEdge["kind"],
    color: e.data?.color,
    width: e.data?.width,
    badgeText: e.data?.badgeText,
    badgeColor: e.data?.badgeColor,
    badgeBg: e.data?.badgeBg,
  }));

  return { nodes: storedNodes, edges: storedEdges, legend };
}

/**
 * Convert stored node to ReactFlow node
 */
export function nodeFromStored(sn: StoredNode): Node<ShapeNodeData> {
  return {
    id: sn.id,
    type: "shape",
    position: sn.position || { x: 0, y: 0 },
    data: {
      label: sn.label || sn.id,
      shape: sn.shape || "rectangle",
      sipocRef: sn.sipocRef || sn.id,
      style: sn.style || undefined,
      interaction: sn.interaction || null,
      isLinkSource: false,
    },
  };
}

/**
 * Convert stored edge to ReactFlow edge
 */
export function edgeFromStored(se: StoredEdge | any, index: number): Edge<OrthogonalEdgeData> {
  const kind = (se.kind || se.type || "orthogonal") as string;
  const color = se.color || DEFAULT_EDGE_COLOR;
  const width = Number.isFinite(se.width) ? se.width : DEFAULT_EDGE_WIDTH;

  return {
    id: se.id || `e${index + 1}`,
    source: se.from || se.source,
    target: se.to || se.target,
    type: kind,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: color, strokeWidth: width },
    data: {
      color,
      width,
      badgeText: se.badgeText,
      badgeColor: se.badgeColor,
      badgeBg: se.badgeBg,
    },
    label: se.label || "",
  } as Edge<OrthogonalEdgeData>;
}

/**
 * Create a new edge with default styling
 */
export function createEdge(source: string, target: string, id?: string): Edge<OrthogonalEdgeData> {
  return {
    id: id || `e-${source}-${target}-${Date.now()}`,
    source,
    target,
    type: "orthogonal",
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { color: DEFAULT_EDGE_COLOR, width: DEFAULT_EDGE_WIDTH },
    style: { stroke: DEFAULT_EDGE_COLOR, strokeWidth: DEFAULT_EDGE_WIDTH },
  } as Edge<OrthogonalEdgeData>;
}
