import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "reactflow";
import type { EdgeProps } from "reactflow";
import type { OrthogonalEdgeData } from "../editor/model/types";

function toNum(x: unknown, fallback: number): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function OrthogonalEdge(props: EdgeProps<OrthogonalEdgeData>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    data,
    label,
    selected,
  } = props;

  const stroke = String(data?.color || (style as any)?.stroke || "#f59ad5");
  const strokeWidth = toNum(data?.width || (style as any)?.strokeWidth, 2);

  const badgeText = (data?.badgeText ?? "").toString().trim();
  const badgeBorder = String(data?.badgeColor || stroke);
  const badgeBg = String(data?.badgeBg || "#ffffff");

  const edgeLabel = label ? String(label) : "";

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
    offset: 20,
  });

  return (
    <>
      {/* Zone de clic invisible plus large pour faciliter la sélection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...(style || {}),
          stroke: selected ? "#3b82f6" : stroke,
          strokeWidth: selected ? strokeWidth + 1.5 : strokeWidth,
          filter: selected ? "drop-shadow(0 0 3px rgba(59,130,246,0.5))" : undefined,
          cursor: "pointer",
        }}
      />

      <EdgeLabelRenderer>
        {edgeLabel && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 18}px)`,
              pointerEvents: "none",
              fontSize: 12,
              color: "#334155",
              background: "rgba(255,255,255,0.9)",
              border: `1px solid ${selected ? "#3b82f6" : "rgba(148,163,184,0.5)"}`,
              padding: "2px 6px",
              borderRadius: 999,
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
              whiteSpace: "nowrap",
            }}
          >
            {edgeLabel}
          </div>
        )}

        {badgeText && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: `3px solid ${selected ? "#3b82f6" : badgeBorder}`,
              background: badgeBg,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              color: selected ? "#3b82f6" : badgeBorder,
              boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {badgeText}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(OrthogonalEdge);
