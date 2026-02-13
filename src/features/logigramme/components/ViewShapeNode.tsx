import { Handle, Position } from "reactflow";
import type { Shape } from "../../../shared/types";
import { getShapeDef } from "./nodes/shapes";

export type { Shape };

function px(n: unknown, fallback: number) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export default function ViewShapeNode({ data }: { data: any }) {
  const shape: Shape = data?.shape || "rectangle";
  const label: string = data?.label || "";
  const st = data?.style || {};

  const def = getShapeDef(shape);
  const width = px(st.width, def.defaultWidth);
  const height = px(st.height, def.defaultHeight);
  const fill = String(st.fill || "#ffffff");
  const stroke = String(st.stroke || "#cbd5e1");
  const text = String(st.text || "#0f172a");
  const fontSize = px(st.fontSize, 13);

  const hasAction = Boolean(data?.interaction);
  const actionHint =
    data?.interaction?.targetType === "url"
      ? "\u{1F517}"
      : data?.interaction?.targetType === "process"
      ? "\u2197"
      : data?.interaction?.action === "tooltip"
      ? "\u24D8"
      : "";

  return (
    <div style={{ width, height, position: "relative", boxShadow: "0 6px 18px rgba(0,0,0,0.10)" }}>
      {/* Input handle */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      {def.render({ fill, stroke, text, fontSize, label, width, height })}

      {hasAction && actionHint ? (
        <div
          style={{
            position: "absolute",
            right: 8,
            bottom: 6,
            fontSize: 12,
            opacity: 0.75,
          }}
        >
          {actionHint}
        </div>
      ) : null}

      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
