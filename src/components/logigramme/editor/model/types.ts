import type { Node, Edge } from "reactflow";

// Re-export domain types
export type { Shape, LogiNode, LogiEdge } from "../../../../types";

/**
 * Stored format (persisted to DB)
 */
export type StoredNode = {
  id: string;
  sipocRef?: string;
  shape?: "rectangle" | "diamond" | "circle" | "diamond-x";
  label?: string;
  position?: { x: number; y: number };
  style?: NodeStyle;
  interaction?: NodeInteraction | null;
};

export type StoredEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind?: "orthogonal" | "step" | "smooth";
  color?: string;
  width?: number;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
};

export type LegendItem = {
  key: string;
  label: string;
  color?: string;
  bg?: string;
};

/**
 * Node style (customizable)
 */
export type NodeStyle = {
  fill?: string;
  stroke?: string;
  text?: string;
  width?: number;
  height?: number;
  fontSize?: number;
};

/**
 * Node interaction (click behavior)
 */
export type NodeInteraction = {
  action: "navigate" | "open" | "tooltip";
  targetType: "process" | "url";
  targetProcessId?: string;
  targetUrl?: string;
  tooltip?: string;
};

/**
 * Node data (ReactFlow node.data)
 */
export type ShapeNodeData = {
  label: string;
  shape: "rectangle" | "diamond" | "circle" | "diamond-x";
  sipocRef?: string;
  style?: NodeStyle;
  interaction?: NodeInteraction | null;
  isLinkSource?: boolean;
};

/**
 * Edge data (ReactFlow edge.data)
 */
export type OrthogonalEdgeData = {
  color?: string;
  width?: number;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
};

/**
 * Connect mode for chaining edges
 */
export type ConnectMode = "off" | "fanout" | "chain";

/**
 * Editor state shape
 */
export type EditorState = {
  nodes: Node<ShapeNodeData>[];
  edges: Edge<OrthogonalEdgeData>[];
  legend: LegendItem[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  connectMode: ConnectMode;
  connectSourceId: string | null;
  autoSync: boolean;
  dirty: boolean;
};
