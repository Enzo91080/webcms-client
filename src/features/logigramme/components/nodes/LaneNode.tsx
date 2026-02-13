import { memo } from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { LaneNodeData } from "../editor/model/types";

type Props = { data: LaneNodeData; selected: boolean };

function LaneNode({ data, selected }: Props) {
  const label = data?.label || "Lane";
  const st = data?.style || {};
  const stroke = st.stroke || "#94a3b8";
  const text = st.text || "#334155";

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={100}
        lineStyle={{ borderColor: "#94a3b8", borderWidth: 1 }}
        handleStyle={{
          width: 6, height: 6, background: "#fff",
          border: "2px solid #94a3b8", borderRadius: 2,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderBottom: `1px dashed ${stroke}`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 8,
            fontSize: 11,
            fontWeight: 600,
            color: text,
            opacity: 0.7,
          }}
        >
          {label}
        </div>

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

export default memo(LaneNode);
