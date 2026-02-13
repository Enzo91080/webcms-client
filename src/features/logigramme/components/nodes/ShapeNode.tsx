import { memo } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { ShapeNodeData } from "../editor/model/types";
import { getShapeDef } from "./shapes";

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
  const width = px(st.width, 220);
  const height = px(st.height, 64);

  const def = getShapeDef(shape);

  const nodeOpacity = typeof st.opacity === "number" ? st.opacity : 1;
  const nodeShadow = st.shadow !== false;

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    cursor: "grab",
    opacity: nodeOpacity,
    boxShadow: isLinkSource
      ? "0 0 0 4px rgba(14,165,233,0.30), 0 12px 18px rgba(0,0,0,0.12)"
      : nodeShadow
        ? "0 6px 18px rgba(0,0,0,0.10)"
        : "none",
  };

  if (isLinkSource) {
    wrapperStyle.outline = "2px solid #0ea5e9";
    wrapperStyle.outlineOffset = -2;
    wrapperStyle.borderRadius = 10;
  }

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={40}
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
      <div className="logiNode" style={wrapperStyle}>
        <style>{handleHoverCss}</style>

        <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
        <Handle type="source" position={Position.Top} id="top-src" style={handleStyle} />
        <Handle type="target" position={Position.Bottom} id="bottom" style={handleStyle} />
        <Handle type="source" position={Position.Bottom} id="bottom-src" style={handleStyle} />
        <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
        <Handle type="source" position={Position.Left} id="left-src" style={handleStyle} />
        <Handle type="target" position={Position.Right} id="right" style={handleStyle} />
        <Handle type="source" position={Position.Right} id="right-src" style={handleStyle} />

        {def.render({ fill, stroke, text, fontSize, label, width, height })}

        {data.locked && (
          <div style={{ position: "absolute", top: 2, right: 4, fontSize: 11, opacity: 0.5, pointerEvents: "none" }}>
            🔒
          </div>
        )}
      </div>
    </>
  );
}

export default memo(ShapeNode);
