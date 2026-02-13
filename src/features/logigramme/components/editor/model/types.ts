import type { Node, Edge } from "reactflow";
import type { Shape } from "../../../../../shared/types";

// Re-export domain types
export type { Shape, LogiNode, LogiEdge } from "../../../../../shared/types";

/**
 * Stored format (persisted to DB)
 */
export type NodeType = "shape" | "pool" | "lane" | "group";

export type StoredNode = {
  id: string;
  sipocRef?: string;
  shape?: Shape;
  label?: string;
  position?: { x: number; y: number };
  style?: NodeStyle;
  interaction?: NodeInteraction | null;
  nodeType?: NodeType;
  locked?: boolean;
  zIndex?: number;
  parentId?: string;
};

export type ArrowheadStyle = "none" | "arrow" | "arrowclosed" | "diamond" | "circle";

export type StoredEdge = {
  id: string;
  from: string;
  to: string;
  fromHandle?: string;
  toHandle?: string;
  label?: string;
  kind?: "orthogonal" | "step" | "smooth";
  color?: string;
  width?: number;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
  arrowStart?: ArrowheadStyle;
  arrowEnd?: ArrowheadStyle;
  labelPosition?: number; // 0..1, default 0.5
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
  borderRadius?: number;
  shadow?: boolean;
  opacity?: number; // 0..1
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
  shape: Shape;
  sipocRef?: string;
  style?: NodeStyle;
  interaction?: NodeInteraction | null;
  isLinkSource?: boolean;
  locked?: boolean;
};

export type PoolNodeData = {
  label: string;
  style?: NodeStyle;
  locked?: boolean;
};

export type LaneNodeData = {
  label: string;
  style?: NodeStyle;
  locked?: boolean;
};

export type GroupNodeData = {
  label: string;
  style?: NodeStyle;
  locked?: boolean;
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
  arrowStart?: ArrowheadStyle;
  arrowEnd?: ArrowheadStyle;
  labelPosition?: number;
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
