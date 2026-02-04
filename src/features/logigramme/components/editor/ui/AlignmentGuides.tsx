import { memo } from "react";

export type Guide = {
  type: "vertical" | "horizontal";
  position: number; // x for vertical, y for horizontal
  start: number;
  end: number;
};

type AlignmentGuidesProps = {
  guides: Guide[];
  color?: string;
};

/**
 * Overlay component to render alignment guides during node dragging
 */
function AlignmentGuides({ guides, color = "#0ea5e9" }: AlignmentGuidesProps) {
  if (guides.length === 0) return null;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {guides.map((guide, index) => {
        if (guide.type === "vertical") {
          return (
            <line
              key={`v-${index}`}
              x1={guide.position}
              y1={guide.start}
              x2={guide.position}
              y2={guide.end}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          );
        } else {
          return (
            <line
              key={`h-${index}`}
              x1={guide.start}
              y1={guide.position}
              x2={guide.end}
              y2={guide.position}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          );
        }
      })}
    </svg>
  );
}

export default memo(AlignmentGuides);
