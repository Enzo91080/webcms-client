export type Shape =
  // Legacy
  | "rectangle"
  | "diamond"
  | "circle"
  | "diamond-x"
  // Events
  | "event-start"
  | "event-start-message"
  | "event-start-timer"
  | "event-intermediate"
  | "event-intermediate-message"
  | "event-intermediate-timer"
  | "event-end"
  | "event-end-message"
  | "event-end-error"
  | "event-end-signal"
  // Tasks
  | "task"
  | "task-user"
  | "task-service"
  | "task-manual"
  | "task-script"
  // Gateways
  | "gateway-exclusive"
  | "gateway-parallel"
  | "gateway-inclusive"
  | "gateway-event"
  // Containers
  | "subprocess"
  | "group"
  // Data
  | "data-object"
  | "data-store"
  // Annotations
  | "text-annotation";

export type LogiNode = {
  id: string;
  shape: Shape;
  label: string;
  position?: { x: number; y: number };
  sipocRef?: string;
  style?: {
    fill?: string;
    stroke?: string;
    text?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    borderRadius?: number;
    shadow?: boolean;
    opacity?: number;
  };
  interaction?: {
    action: "navigate" | "open" | "tooltip";
    targetType: "process" | "url";
    targetProcessId?: string;
    targetUrl?: string;
    tooltip?: string;
  } | null;
};

export type ArrowheadStyle = "none" | "arrow" | "arrowclosed" | "diamond" | "circle";

export type LogiEdge = {
  id: string;
  from: string;
  to: string;
  fromHandle?: string;
  toHandle?: string;
  label?: string;
  color?: string;
  width?: number;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
  kind?: "orthogonal" | "step" | "smooth";
  arrowStart?: ArrowheadStyle;
  arrowEnd?: ArrowheadStyle;
  labelPosition?: number;
};

export type LegendItem = {
  id: string;
  color: string;
  label: string;
};
