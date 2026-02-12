import { memo } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { ShapeNodeData } from "../editor/model/types";

function px(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

const handleStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  background: "#fff",
  border: "2px solid #94a3b8",
  opacity: 0,
  transition: "opacity 150ms, border-color 150ms, transform 150ms",
};

const handleHoverCss = `
.logiNode:hover .react-flow__handle {
  opacity: 1 !important;
}
.react-flow__handle:hover {
  border-color: #3b82f6 !important;
  transform: scale(1.3);
}
.react-flow__handle.connecting {
  border-color: #3b82f6 !important;
  opacity: 1 !important;
}
`;

type ShapeNodeProps = {
  data: ShapeNodeData;
  selected: boolean;
};

function ShapeNode({ data, selected }: ShapeNodeProps) {
  const shape = data?.shape || "rectangle";
  const label = data?.label || "";
  const st = data?.style || {};
  const isLinkSource = Boolean(data?.isLinkSource);

  const fill = String(st.fill || "#ffffff");
  const stroke = String(st.stroke || "#cbd5e1");
  const text = String(st.text || "#0f172a");
  const fontSize = px(st.fontSize, 13);

  const baseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
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
  }

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={40}
        lineStyle={{ borderColor: "#3b82f6", borderWidth: 1 }}
        handleStyle={{
          width: 8,
          height: 8,
          background: "#fff",
          border: "2px solid #3b82f6",
          borderRadius: 2,
        }}
      />
      <div className="logiNode" style={baseStyle}>
        <style>{handleHoverCss}</style>

        <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
        <Handle type="source" position={Position.Top} id="top-src" style={handleStyle} />
        <Handle type="target" position={Position.Bottom} id="bottom" style={handleStyle} />
        <Handle type="source" position={Position.Bottom} id="bottom-src" style={handleStyle} />
        <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
        <Handle type="source" position={Position.Left} id="left-src" style={handleStyle} />
        <Handle type="target" position={Position.Right} id="right" style={handleStyle} />
        <Handle type="source" position={Position.Right} id="right-src" style={handleStyle} />

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
      </div>
    </>
  );
}

export default memo(ShapeNode);
