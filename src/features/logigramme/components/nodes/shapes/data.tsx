import type { ShapeDefinition, ShapeRenderProps } from "./types";

function DataObjectShape({ fill, stroke, text, fontSize, label }: ShapeRenderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg
        viewBox="0 0 60 80"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* Document shape with folded corner */}
        <path
          d="M2,2 L42,2 L58,18 L58,78 L2,78 Z"
          fill={fill} stroke={stroke} strokeWidth="2"
        />
        {/* Fold */}
        <path
          d="M42,2 L42,18 L58,18"
          fill="none" stroke={stroke} strokeWidth="1.5"
        />
      </svg>
      <div
        style={{
          position: "relative",
          color: text,
          fontSize,
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.2,
          padding: "18px 8px 8px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function DataStoreShape({ fill, stroke, text, fontSize, label }: ShapeRenderProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg
        viewBox="0 0 80 60"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* Cylinder shape */}
        <ellipse cx="40" cy="12" rx="36" ry="10" fill={fill} stroke={stroke} strokeWidth="2" />
        <path
          d="M4,12 L4,48 Q4,58 40,58 Q76,58 76,48 L76,12"
          fill={fill} stroke={stroke} strokeWidth="2"
        />
        <ellipse cx="40" cy="12" rx="36" ry="10" fill={fill} stroke={stroke} strokeWidth="2" />
      </svg>
      <div
        style={{
          position: "relative",
          color: text,
          fontSize,
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.2,
          padding: "14px 8px 4px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export const dataShapes: ShapeDefinition[] = [
  {
    key: "data-object",
    category: "data",
    label: "Données",
    defaultWidth: 60,
    defaultHeight: 80,
    render: DataObjectShape,
    icon: () => (
      <svg width="24" height="30" viewBox="0 0 24 30">
        <path d="M2,2 L16,2 L22,8 L22,28 L2,28 Z" fill="#e8eaf6" stroke="#3f51b5" strokeWidth="1.5" />
        <path d="M16,2 L16,8 L22,8" fill="none" stroke="#3f51b5" strokeWidth="1" />
      </svg>
    ),
  },
  {
    key: "data-store",
    category: "data",
    label: "Base de données",
    defaultWidth: 80,
    defaultHeight: 60,
    render: DataStoreShape,
    icon: () => (
      <svg width="30" height="24" viewBox="0 0 30 24">
        <ellipse cx="15" cy="6" rx="12" ry="4" fill="#e8eaf6" stroke="#3f51b5" strokeWidth="1.5" />
        <path d="M3,6 L3,18 Q3,22 15,22 Q27,22 27,18 L27,6" fill="none" stroke="#3f51b5" strokeWidth="1.5" />
      </svg>
    ),
  },
];
