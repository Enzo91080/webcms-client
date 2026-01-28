import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "reactflow";
import type { EdgeProps } from "reactflow";

function toNum(x: unknown, fallback: number) {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export default function OrthogonalEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style } = props;

  const data: any = (props as any).data || {};
  const stroke = String(data.color || (style as any)?.stroke || "#f59ad5");
  const strokeWidth = toNum(data.width || (style as any)?.strokeWidth, 2);

  const badgeText = (data.badgeText ?? "").toString().trim();
  const badgeBorder = String(data.badgeColor || stroke);
  const badgeBg = String(data.badgeBg || "#ffffff");

  const edgeLabel = (props as any).label ? String((props as any).label) : "";

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
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...(style || {}),
          stroke,
          strokeWidth,
        }}
      />

      <EdgeLabelRenderer>
        {/* Optional edge label */}
        {edgeLabel ? (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 18}px)`,
              pointerEvents: "none",
              fontSize: 12,
              color: "#334155",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(148,163,184,0.5)",
              padding: "2px 6px",
              borderRadius: 999,
              boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
              whiteSpace: "nowrap",
            }}
          >
            {edgeLabel}
          </div>
        ) : null}

        {/* Optional badge bubble (pastille) */}
        {badgeText ? (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: `3px solid ${badgeBorder}`,
              background: badgeBg,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              color: badgeBorder,
              boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {badgeText}
          </div>
        ) : null}
      </EdgeLabelRenderer>
    </>
  );
}
