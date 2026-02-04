import { Handle, Position } from "reactflow";
import type { Shape } from "../../../shared/types";

export type { Shape };

function px(n: unknown, fallback: number) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export default function ViewShapeNode({ data }: { data: any }) {
  const shape: Shape = data?.shape || "rectangle";
  const label: string = data?.label || "";
  const st = data?.style || {};

  const width = px(st.width, 220);
  const height = px(st.height, shape === "diamond" || shape === "diamond-x" ? 110 : 64);
  const fill = String(st.fill || "#ffffff");
  const stroke = String(st.stroke || "#cbd5e1");
  const text = String(st.text || "#0f172a");
  const fontSize = px(st.fontSize, 13);

  const hasAction = Boolean(data?.interaction);
  const actionHint =
    data?.interaction?.targetType === "url"
      ? "🔗"
      : data?.interaction?.targetType === "process"
      ? "↗"
      : data?.interaction?.action === "tooltip"
      ? "ⓘ"
      : "";

  const baseStyle: any = {
    width,
    height,
    background: fill,
    border: `2px solid ${stroke}`,
    color: text,
    boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
    display: "grid",
    placeItems: "center",
    fontWeight: 600,
    fontSize,
    position: "relative",
    padding: "10px 12px",
    textAlign: "center",
    lineHeight: 1.2,
  };

  if (shape === "circle") {
    baseStyle.borderRadius = "999px";
  } else if (shape === "diamond" || shape === "diamond-x") {
    baseStyle.transform = "rotate(45deg)";
    baseStyle.width = height;
    baseStyle.height = height;
  } else {
    baseStyle.borderRadius = 10;
  }

  return (
    <div style={baseStyle}>
      {/* Input handle */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {/* Label */}
      <div style={shape === "diamond" || shape === "diamond-x" ? { transform: "rotate(-45deg)", padding: 6 } : {}}>
        {label}
        {shape === "diamond-x" ? <div style={{ fontSize: 12, opacity: 0.85 }}>✕</div> : null}
      </div>

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
