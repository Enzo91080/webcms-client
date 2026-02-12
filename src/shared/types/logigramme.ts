export type Shape = "rectangle" | "diamond" | "circle" | "diamond-x";

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
  };
  interaction?: {
    action: "navigate" | "open" | "tooltip";
    targetType: "process" | "url";
    targetProcessId?: string;
    targetUrl?: string;
    tooltip?: string;
  } | null;
};

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
};

export type LegendItem = {
  id: string;
  color: string;
  label: string;
};
