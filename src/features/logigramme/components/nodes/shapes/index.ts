import type { Shape } from "../../../../../shared/types";
import type { ShapeDefinition, ShapeCategory } from "./types";

import { legacyShapes } from "./legacy";
import { eventShapes } from "./events";
import { taskShapes } from "./tasks";
import { gatewayShapes } from "./gateways";
import { containerShapes } from "./containers";
import { dataShapes } from "./data";
import { annotationShapes } from "./annotations";

export type { ShapeDefinition, ShapeRenderProps, ShapeCategory } from "./types";

// All shape definitions in a flat array
const allShapes: ShapeDefinition[] = [
  ...legacyShapes,
  ...eventShapes,
  ...taskShapes,
  ...gatewayShapes,
  ...containerShapes,
  ...dataShapes,
  ...annotationShapes,
];

// Registry: Shape key → ShapeDefinition
export const shapeRegistry: Record<string, ShapeDefinition> = Object.fromEntries(
  allShapes.map((s) => [s.key, s])
);

// Get a shape definition (with fallback to rectangle)
export function getShapeDef(shape: Shape | string): ShapeDefinition {
  return shapeRegistry[shape] || shapeRegistry["rectangle"];
}

// Get shapes grouped by category
export function getShapesByCategory(): { category: ShapeCategory; label: string; shapes: ShapeDefinition[] }[] {
  return [
    { category: "events", label: "Événements", shapes: eventShapes },
    { category: "tasks", label: "Tâches", shapes: taskShapes },
    { category: "gateways", label: "Décisions", shapes: gatewayShapes },
    { category: "data", label: "Données", shapes: dataShapes },
    { category: "containers", label: "Conteneurs", shapes: containerShapes },
    { category: "annotations", label: "Annotations", shapes: annotationShapes },
    { category: "legacy", label: "Basiques", shapes: legacyShapes },
  ];
}

// Get all shape definitions
export function getAllShapes(): ShapeDefinition[] {
  return allShapes;
}
