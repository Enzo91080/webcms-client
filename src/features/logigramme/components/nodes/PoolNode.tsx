import { memo } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { PoolNodeData } from "../editor/model/types";

type Props = { data: PoolNodeData; selected: boolean };

function PoolNode({ data, selected }: Props) {
  const label = data?.label || "Pool";
  const st = data?.style || {};
  const fill = st.fill || "#f0f9ff";
  const stroke = st.stroke || "#0284c7";
  const text = st.text || "#0c4a6e";

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={300}
        minHeight={150}
        lineStyle={{ borderColor: "#0284c7", borderWidth: 1 }}
        handleStyle={{
          width: 8, height: 8, background: "#fff",
          border: "2px solid #0284c7", borderRadius: 2,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          border: `2px solid ${stroke}`,
          borderRadius: 4,
          background: fill,
          display: "flex",
          position: "relative",
        }}
      >
        {/* Vertical header on the left */}
        <div
          style={{
            width: 30,
            minHeight: "100%",
            background: stroke,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "2px 0 0 2px",
          }}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 1,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        </div>
        {/* Content area for lanes/children */}
        <div style={{ flex: 1, position: "relative" }} />

        {data.locked && (
          <div style={{ position: "absolute", top: 4, right: 6, fontSize: 11, opacity: 0.5 }}>
            🔒
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

export default memo(PoolNode);
