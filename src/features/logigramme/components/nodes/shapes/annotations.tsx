import type { ShapeDefinition, ShapeRenderProps } from "./types";

function TextAnnotationShape({ fill, stroke, text, fontSize, label }: ShapeRenderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Open bracket on the left side */}
      <svg
        width="12"
        viewBox="0 0 12 60"
        preserveAspectRatio="none"
        style={{ height: "100%", flexShrink: 0 }}
      >
        <path d="M12,0 L2,0 L2,60 L12,60" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
      <div
        style={{
          flex: 1,
          color: text,
          fontSize,
          fontWeight: 400,
          fontStyle: "italic",
          padding: "6px 8px",
          lineHeight: 1.3,
          background: fill,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export const annotationShapes: ShapeDefinition[] = [
  {
    key: "text-annotation",
    category: "annotations",
    label: "Annotation",
    defaultWidth: 180,
    defaultHeight: 50,
    render: TextAnnotationShape,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <path d="M8,2 L2,2 L2,22 L8,22" fill="none" stroke="#475569" strokeWidth="1.5" />
        <line x1="10" y1="8" x2="30" y2="8" stroke="#475569" strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="12" x2="28" y2="12" stroke="#475569" strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="16" x2="22" y2="16" stroke="#475569" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
  },
];
