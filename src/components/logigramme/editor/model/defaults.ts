import { MarkerType } from "reactflow";
import type { LegendItem } from "./types";

/**
 * Default legend items
 */
export function defaultLegend(): LegendItem[] {
  return [
    { key: "1", label: "Manager l'entreprise", color: "#64748b" },
    { key: "2", label: "Vendre", color: "#f59e0b" },
    { key: "3", label: "Planifier", color: "#e879f9" },
    { key: "4", label: "Manager le Programme", color: "#0ea5e9" },
    { key: "5", label: "Réaliser", color: "#475569" },
    { key: "6", label: "Valider", color: "#84cc16" },
  ];
}

/**
 * Default edge color
 */
export const DEFAULT_EDGE_COLOR = "#f59ad5";
export const DEFAULT_EDGE_WIDTH = 2;

/**
 * Default edge options for ReactFlow
 */
export const defaultEdgeOptions = {
  type: "orthogonal" as const,
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { stroke: DEFAULT_EDGE_COLOR, strokeWidth: DEFAULT_EDGE_WIDTH },
  data: { color: DEFAULT_EDGE_COLOR, width: DEFAULT_EDGE_WIDTH },
};

/**
 * Grid settings
 */
export const GRID_SIZE = 10;
export const SNAP_GRID: [number, number] = [GRID_SIZE, GRID_SIZE];

/**
 * Viewport settings
 */
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2;
export const FIT_VIEW_PADDING = 0.18;
