import { memo } from "react";
import { Handle, Position } from "reactflow";
import type { ShapeNodeData } from "../editor/model/types";

function px(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

type ShapeNodeProps = {
  data: ShapeNodeData;
};

function ShapeNode({ data }: ShapeNodeProps) {
  const shape = data?.shape || "rectangle";
  const label = data?.label || "";
  const st = data?.style || {};
  const isLinkSource = Boolean(data?.isLinkSource);

  const width = px(st.width, 220);
  const height = px(st.height, shape === "diamond" || shape === "diamond-x" ? 110 : 64);
  const fill = String(st.fill || "#ffffff");
  const stroke = String(st.stroke || "#cbd5e1");
  const text = String(st.text || "#0f172a");
  const fontSize = px(st.fontSize, 13);

  const baseStyle: React.CSSProperties = {
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
    cursor: "grab",
    borderRadius: 10,
  };

  if (isLinkSource) {
    baseStyle.boxShadow = "0 0 0 4px rgba(14,165,233,0.30), 0 12px 18px rgba(0,0,0,0.12)";
    baseStyle.borderColor = "#0ea5e9";
  }

  if (shape === "circle") {
    baseStyle.borderRadius = "999px";
  } else if (shape === "diamond" || shape === "diamond-x") {
    baseStyle.transform = "rotate(45deg)";
    baseStyle.width = height;
    baseStyle.height = height;
  }

  return (
    <div style={baseStyle}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        style={
          shape === "diamond" || shape === "diamond-x"
            ? { transform: "rotate(-45deg)", padding: 6 }
            : {}
        }
      >
        {label}
        {shape === "diamond-x" && (
          <div style={{ fontSize: 12, opacity: 0.85 }}>✕</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export default memo(ShapeNode);
