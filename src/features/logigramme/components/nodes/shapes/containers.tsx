import type { ShapeDefinition, ShapeRenderProps } from "./types";

function SubprocessShape({ fill, stroke, text, fontSize, label }: ShapeRenderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: fill,
        border: `2px solid ${stroke}`,
        borderRadius: 10,
        color: text,
        fontSize,
        display: "grid",
        placeItems: "center",
        fontWeight: 600,
        padding: "10px 12px",
        textAlign: "center",
        lineHeight: 1.2,
        position: "relative",
      }}
    >
      {label}
      {/* Subprocess marker: [+] at bottom center */}
      <div
        style={{
          position: "absolute",
          bottom: 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: 14,
          height: 14,
          border: `1.5px solid ${stroke}`,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          fontSize: 10,
          lineHeight: 1,
          fontWeight: 700,
          color: stroke,
          background: fill,
        }}
      >
        +
      </div>
    </div>
  );
}

function GroupShape({ stroke, text, fontSize, label }: ShapeRenderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        border: `2px dashed ${stroke}`,
        borderRadius: 12,
        color: text,
        fontSize,
        fontWeight: 600,
        padding: "8px 12px",
        lineHeight: 1.2,
      }}
    >
      {label}
    </div>
  );
}

export const containerShapes: ShapeDefinition[] = [
  {
    key: "subprocess",
    category: "containers",
    label: "Sous-processus",
    defaultWidth: 220,
    defaultHeight: 80,
    render: SubprocessShape,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="6" fill="#f3e5f5" stroke="#7b1fa2" strokeWidth="1.5" />
        <rect x="14" y="17" width="8" height="5" rx="1" fill="none" stroke="#7b1fa2" strokeWidth="1" />
        <line x1="18" y1="18" x2="18" y2="21" stroke="#7b1fa2" strokeWidth="1" />
        <line x1="15.5" y1="19.5" x2="20.5" y2="19.5" stroke="#7b1fa2" strokeWidth="1" />
      </svg>
    ),
  },
  {
    key: "group",
    category: "containers",
    label: "Groupe",
    defaultWidth: 300,
    defaultHeight: 200,
    render: GroupShape,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="6" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
    ),
  },
];
