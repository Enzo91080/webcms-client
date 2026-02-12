import { memo } from "react";
import { Typography } from "antd";

export type PaletteShape = {
  type: string;
  label: string;
  icon: React.ReactNode;
};

const BPMN_SHAPES: PaletteShape[] = [
  {
    type: "rectangle",
    label: "Tâche",
    icon: (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="4" fill="#fff" stroke="#475569" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    type: "diamond",
    label: "Décision",
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" rx="2" fill="#fff" stroke="#475569" strokeWidth="1.5" transform="rotate(45 15 15)" />
      </svg>
    ),
  },
  {
    type: "circle",
    label: "Événement",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="#fff" stroke="#475569" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    type: "diamond-x",
    label: "Exclusion",
    icon: (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" rx="2" fill="#fff" stroke="#475569" strokeWidth="1.5" transform="rotate(45 15 15)" />
        <line x1="10" y1="10" x2="20" y2="20" stroke="#475569" strokeWidth="1.5" />
        <line x1="20" y1="10" x2="10" y2="20" stroke="#475569" strokeWidth="1.5" />
      </svg>
    ),
  },
];

function ShapePalette() {
  function onDragStart(e: React.DragEvent, shapeType: string, label: string) {
    e.dataTransfer.setData("application/logigramme-shape", shapeType);
    e.dataTransfer.setData("application/logigramme-label", label);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div style={{ padding: "10px 8px" }}>
      <Typography.Text strong style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
        Formes
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 10 }}>
        Glisse une forme sur le canvas
      </Typography.Text>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {BPMN_SHAPES.map((shape) => (
          <div
            key={shape.type}
            draggable
            onDragStart={(e) => onDragStart(e, shape.type, shape.label)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 4px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#fff",
              cursor: "grab",
              transition: "border-color 150ms, box-shadow 150ms",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#93c5fd";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(59,130,246,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {shape.icon}
            <span style={{ fontSize: 10, color: "#475569", fontWeight: 500 }}>
              {shape.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ShapePalette);
