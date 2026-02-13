import type { Shape } from "../../../../../shared/types";

export type ShapeCategory =
  | "events"
  | "tasks"
  | "gateways"
  | "data"
  | "annotations"
  | "containers"
  | "legacy";

export type ShapeDefinition = {
  key: Shape;
  category: ShapeCategory;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
  render: (props: ShapeRenderProps) => React.ReactElement;
  icon: () => React.ReactElement;
};

export type ShapeRenderProps = {
  fill: string;
  stroke: string;
  text: string;
  fontSize: number;
  label: string;
  width: number;
  height: number;
};
