import { memo, useState } from "react";
import { Collapse, Input, Typography } from "antd";
import { getShapesByCategory } from "../../nodes/shapes";

function ShapePalette() {
  const [search, setSearch] = useState("");
  const categories = getShapesByCategory();

  function onDragStart(e: React.DragEvent, shapeType: string, label: string) {
    e.dataTransfer.setData("application/logigramme-shape", shapeType);
    e.dataTransfer.setData("application/logigramme-label", label);
    e.dataTransfer.effectAllowed = "move";
  }

  const searchLower = search.toLowerCase();
  const filtered = categories
    .map((cat) => ({
      ...cat,
      shapes: searchLower
        ? cat.shapes.filter((s) => s.label.toLowerCase().includes(searchLower))
        : cat.shapes,
    }))
    .filter((cat) => cat.shapes.length > 0);

  return (
    <div style={{ padding: "10px 6px" }}>
      <Typography.Text strong style={{ fontSize: 12, display: "block", marginBottom: 6, paddingLeft: 2 }}>
        Formes BPMN
      </Typography.Text>

      <Input.Search
        placeholder="Rechercher..."
        size="small"
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <Collapse
        size="small"
        defaultActiveKey={filtered.map((c) => c.category)}
        items={filtered.map((cat) => ({
          key: cat.category,
          label: <span style={{ fontSize: 11, fontWeight: 600 }}>{cat.label}</span>,
          children: (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {cat.shapes.map((shape) => {
                const Icon = shape.icon;
                return (
                  <div
                    key={shape.key}
                    draggable
                    onDragStart={(e) => onDragStart(e, shape.key, shape.label)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      padding: "6px 2px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
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
                    <Icon />
                    <span style={{ fontSize: 9, color: "#475569", fontWeight: 500, textAlign: "center", lineHeight: 1.1 }}>
                      {shape.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ),
        }))}
      />
    </div>
  );
}

export default memo(ShapePalette);
