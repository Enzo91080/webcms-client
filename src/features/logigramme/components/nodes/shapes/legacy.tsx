import type { ShapeDefinition, ShapeRenderProps } from "./types";

function RectangleShape({ fill, stroke, label, text, fontSize }: ShapeRenderProps) {
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
      }}
    >
      {label}
    </div>
  );
}

function DiamondShape({ fill, stroke, label, text, fontSize }: ShapeRenderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: fill,
        border: `2px solid ${stroke}`,
        borderRadius: 4,
        color: text,
        fontSize,
        display: "grid",
        placeItems: "center",
        fontWeight: 600,
        transform: "rotate(45deg)",
        lineHeight: 1.2,
      }}
    >
      <div style={{ transform: "rotate(-45deg)", padding: 6 }}>{label}</div>
    </div>
  );
}

function DiamondXShape({ fill, stroke, label, text, fontSize }: ShapeRenderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: fill,
        border: `2px solid ${stroke}`,
        borderRadius: 4,
        color: text,
        fontSize,
        display: "grid",
        placeItems: "center",
        fontWeight: 600,
        transform: "rotate(45deg)",
        lineHeight: 1.2,
      }}
    >
      <div style={{ transform: "rotate(-45deg)", padding: 6 }}>
        {label}
        <div style={{ fontSize: 12, opacity: 0.85 }}>✕</div>
      </div>
    </div>
  );
}

function CircleShape({ fill, stroke, label, text, fontSize }: ShapeRenderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: fill,
        border: `2px solid ${stroke}`,
        borderRadius: "999px",
        color: text,
        fontSize,
        display: "grid",
        placeItems: "center",
        fontWeight: 600,
        padding: "10px 12px",
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      {label}
    </div>
  );
}

export const legacyShapes: ShapeDefinition[] = [
  {
    key: "rectangle",
    category: "legacy",
    label: "Rectangle",
    defaultWidth: 220,
    defaultHeight: 64,
    render: RectangleShape,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="4" fill="#fff" stroke="#475569" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: "diamond",
    category: "legacy",
    label: "Losange",
    defaultWidth: 110,
    defaultHeight: 110,
    render: DiamondShape,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" rx="2" fill="#fff" stroke="#475569" strokeWidth="1.5" transform="rotate(45 15 15)" />
      </svg>
    ),
  },
  {
    key: "circle",
    category: "legacy",
    label: "Cercle",
    defaultWidth: 80,
    defaultHeight: 80,
    render: CircleShape,
    icon: () => (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="#fff" stroke="#475569" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: "diamond-x",
    category: "legacy",
    label: "Exclusion",
    defaultWidth: 110,
    defaultHeight: 110,
    render: DiamondXShape,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" rx="2" fill="#fff" stroke="#475569" strokeWidth="1.5" transform="rotate(45 15 15)" />
        <line x1="10" y1="10" x2="20" y2="20" stroke="#475569" strokeWidth="1.5" />
        <line x1="20" y1="10" x2="10" y2="20" stroke="#475569" strokeWidth="1.5" />
      </svg>
    ),
  },
];
