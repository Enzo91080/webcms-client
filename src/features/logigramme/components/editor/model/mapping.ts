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
  const storedNodes: StoredNode[] = nodes.map((n) => {
    // Persist actual node dimensions (from resize) back into style
    const style = { ...(n.data?.style || {}) };
    if (n.width && n.width > 0) style.width = Math.round(n.width);
    if (n.height && n.height > 0) style.height = Math.round(n.height);
    return {
      id: n.id,
      sipocRef: n.data?.sipocRef || n.id,
      shape: n.data?.shape || "rectangle",
      label: String(n.data?.label || n.id),
      position: n.position,
      style,
      interaction: n.data?.interaction || null,
      nodeType: (n.type as any) || "shape",
      locked: n.data?.locked || undefined,
      zIndex: n.zIndex || undefined,
      parentId: (n as any).parentNode || undefined,
    };
  });

  const storedEdges: StoredEdge[] = edges.map((e, i) => ({
    id: e.id || `e${i + 1}`,
    from: String(e.source),
    to: String(e.target),
    fromHandle: e.sourceHandle || undefined,
    toHandle: e.targetHandle || undefined,
    label: String((e as any).label || ""),
    kind: (e.type || "orthogonal") as StoredEdge["kind"],
    color: e.data?.color,
    width: e.data?.width,
    badgeText: e.data?.badgeText,
    badgeColor: e.data?.badgeColor,
    badgeBg: e.data?.badgeBg,
    arrowStart: e.data?.arrowStart,
    arrowEnd: e.data?.arrowEnd,
    labelPosition: e.data?.labelPosition,
  }));

  return { nodes: storedNodes, edges: storedEdges, legend };
}

/**
 * Convert stored node to ReactFlow node
 */
export function nodeFromStored(sn: StoredNode): Node<ShapeNodeData> {
  const w = sn.style?.width;
  const h = sn.style?.height;
  const nodeType = sn.nodeType || "shape";
  return {
    id: sn.id,
    type: nodeType,
    position: sn.position || { x: 0, y: 0 },
    ...(w ? { width: w } : {}),
    ...(h ? { height: h } : {}),
    ...(sn.zIndex != null ? { zIndex: sn.zIndex } : {}),
    ...(sn.parentId ? { parentNode: sn.parentId, extent: "parent" as const } : {}),
    style: { width: w || undefined, height: h || undefined },
    data: {
      label: sn.label || sn.id,
      shape: sn.shape || "rectangle",
      sipocRef: sn.sipocRef || sn.id,
      style: sn.style || undefined,
      interaction: sn.interaction || null,
      isLinkSource: false,
      locked: sn.locked || undefined,
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
    sourceHandle: se.fromHandle || undefined,
    targetHandle: se.toHandle || undefined,
    type: kind,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: color, strokeWidth: width },
    data: {
      color,
      width,
      badgeText: se.badgeText,
      badgeColor: se.badgeColor,
      badgeBg: se.badgeBg,
      arrowStart: se.arrowStart,
      arrowEnd: se.arrowEnd,
      labelPosition: se.labelPosition,
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
