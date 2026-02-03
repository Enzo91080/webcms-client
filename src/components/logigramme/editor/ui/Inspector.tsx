import {
  Badge,
  Button,
  Card,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tabs,
  Typography,
} from "antd";
import { memo } from "react";
import type { Node, Edge } from "reactflow";
import type { LegendItem, ShapeNodeData, OrthogonalEdgeData } from "../model/types";

type InspectorProps = {
  selectedNode: Node<ShapeNodeData> | null;
  selectedEdge: Edge<OrthogonalEdgeData> | null;
  legend: LegendItem[];
  onUpdateNode: (patch: Partial<ShapeNodeData>) => void;
  onUpdateNodeStyle: (patch: Record<string, any>) => void;
  onUpdateEdge: (patch: any) => void;
  onDeleteEdge: () => void;
  onResetLegend: () => void;
  onAddLegendItem: () => void;
  onUpdateLegendItem: (index: number, patch: Partial<LegendItem>) => void;
  onDeleteLegendItem: (index: number) => void;
};

function Inspector({
  selectedNode,
  selectedEdge,
  legend,
  onUpdateNode,
  onUpdateNodeStyle,
  onUpdateEdge,
  onDeleteEdge,
  onResetLegend,
  onAddLegendItem,
  onUpdateLegendItem,
  onDeleteLegendItem,
}: InspectorProps) {
  const selectionKind = selectedNode ? "node" : selectedEdge ? "edge" : "none";
  const selectionId = selectedNode?.id || selectedEdge?.id || "—";

  return (
    <Card
      size="small"
      style={{
        boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
        border: "1px solid #e5e7eb",
      }}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <Typography.Text strong>Inspector</Typography.Text>
            <div style={{ fontSize: 12, opacity: 0.65 }}>
              Sélection + styles + légende
            </div>
          </div>
          <Badge
            color={
              selectionKind === "node"
                ? "#0ea5e9"
                : selectionKind === "edge"
                ? "#f59e0b"
                : "#94a3b8"
            }
            text={
              selectionKind === "node"
                ? "Node"
                : selectionKind === "edge"
                ? "Edge"
                : "None"
            }
          />
        </div>
      }
    >
      {/* Selection info */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 10,
          background: "#f8fafc",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>ID</div>
            <div
              style={{
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectionId}
            </div>
          </div>
          {selectedEdge && (
            <Button danger size="small" onClick={onDeleteEdge}>
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <Tabs
        defaultActiveKey="props"
        items={[
          {
            key: "props",
            label: "Propriétés",
            children: (
              <PropertiesPanel
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                onUpdateNode={onUpdateNode}
                onUpdateNodeStyle={onUpdateNodeStyle}
                onUpdateEdge={onUpdateEdge}
              />
            ),
          },
          {
            key: "legend",
            label: "Légende",
            children: (
              <LegendPanel
                legend={legend}
                onReset={onResetLegend}
                onAdd={onAddLegendItem}
                onUpdate={onUpdateLegendItem}
                onDelete={onDeleteLegendItem}
              />
            ),
          },
          {
            key: "help",
            label: "Aide",
            children: <HelpPanel />,
          },
        ]}
      />
    </Card>
  );
}

// ─── Properties Panel ────────────────────────────────────────────────────────

type PropertiesPanelProps = {
  selectedNode: Node<ShapeNodeData> | null;
  selectedEdge: Edge<OrthogonalEdgeData> | null;
  onUpdateNode: (patch: Partial<ShapeNodeData>) => void;
  onUpdateNodeStyle: (patch: Record<string, any>) => void;
  onUpdateEdge: (patch: any) => void;
};

function PropertiesPanel({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateNodeStyle,
  onUpdateEdge,
}: PropertiesPanelProps) {
  if (selectedNode) {
    return (
      <Collapse
        defaultActiveKey={["basics", "style"]}
        items={[
          {
            key: "basics",
            label: "Node",
            children: (
              <Form layout="vertical">
                <Form.Item label="Libellé" style={{ marginBottom: 10 }}>
                  <Input
                    value={String(selectedNode.data?.label || "")}
                    onChange={(e) => onUpdateNode({ label: e.target.value })}
                  />
                </Form.Item>
                <Form.Item label="Forme" style={{ marginBottom: 0 }}>
                  <Select
                    value={String(selectedNode.data?.shape || "rectangle")}
                    onChange={(v) => onUpdateNode({ shape: v as any })}
                    options={[
                      { value: "rectangle", label: "Rectangle" },
                      { value: "diamond", label: "Losange" },
                      { value: "circle", label: "Cercle" },
                      { value: "diamond-x", label: "Losange ✕" },
                    ]}
                  />
                </Form.Item>
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                  Lié à <b>SIPOC.ref</b>. Ajoute une étape dans SIPOC puis sync.
                </div>
              </Form>
            ),
          },
          {
            key: "style",
            label: "Style",
            children: (
              <Form layout="vertical">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <Form.Item label="Largeur" style={{ marginBottom: 0 }}>
                    <InputNumber
                      style={{ width: "100%" }}
                      min={120}
                      max={520}
                      value={Number(selectedNode.data?.style?.width || 220)}
                      onChange={(v) => onUpdateNodeStyle({ width: v })}
                    />
                  </Form.Item>
                  <Form.Item label="Hauteur" style={{ marginBottom: 0 }}>
                    <InputNumber
                      style={{ width: "100%" }}
                      min={50}
                      max={360}
                      value={Number(selectedNode.data?.style?.height || 80)}
                      onChange={(v) => onUpdateNodeStyle({ height: v })}
                    />
                  </Form.Item>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <Form.Item label="Fond" style={{ marginBottom: 0 }}>
                    <Input
                      type="color"
                      value={String(selectedNode.data?.style?.fill || "#ffffff")}
                      onChange={(e) => onUpdateNodeStyle({ fill: e.target.value })}
                    />
                  </Form.Item>
                  <Form.Item label="Contour" style={{ marginBottom: 0 }}>
                    <Input
                      type="color"
                      value={String(selectedNode.data?.style?.stroke || "#cbd5e1")}
                      onChange={(e) => onUpdateNodeStyle({ stroke: e.target.value })}
                    />
                  </Form.Item>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <Form.Item label="Texte" style={{ marginBottom: 0 }}>
                    <Input
                      type="color"
                      value={String(selectedNode.data?.style?.text || "#0f172a")}
                      onChange={(e) => onUpdateNodeStyle({ text: e.target.value })}
                    />
                  </Form.Item>
                  <Form.Item label="Font" style={{ marginBottom: 0 }}>
                    <InputNumber
                      style={{ width: "100%" }}
                      min={10}
                      max={22}
                      value={Number(selectedNode.data?.style?.fontSize || 13)}
                      onChange={(v) => onUpdateNodeStyle({ fontSize: v })}
                    />
                  </Form.Item>
                </div>
              </Form>
            ),
          },
        ]}
      />
    );
  }

  if (selectedEdge) {
    return (
      <Collapse
        defaultActiveKey={["basics", "style", "badge"]}
        items={[
          {
            key: "basics",
            label: "Edge",
            children: (
              <Form layout="vertical">
                <Form.Item label="Type" style={{ marginBottom: 10 }}>
                  <Select
                    value={String(selectedEdge.type || "orthogonal")}
                    onChange={(v) => onUpdateEdge({ type: v })}
                    options={[
                      { value: "orthogonal", label: "Orthogonal (Visio)" },
                      { value: "step", label: "Step" },
                      { value: "smooth", label: "Smooth" },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="Libellé (optionnel)" style={{ marginBottom: 0 }}>
                  <Input
                    value={String((selectedEdge as any).label || "")}
                    onChange={(e) => onUpdateEdge({ label: e.target.value })}
                  />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: "style",
            label: "Style",
            children: (
              <Form layout="vertical">
                <Form.Item label="Couleur du trait" style={{ marginBottom: 10 }}>
                  <Input
                    type="color"
                    value={String(selectedEdge.data?.color || "#f59ad5")}
                    onChange={(e) =>
                      onUpdateEdge({
                        data: { ...selectedEdge.data, color: e.target.value },
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="Épaisseur" style={{ marginBottom: 0 }}>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    max={8}
                    value={Number(selectedEdge.data?.width || 2)}
                    onChange={(v) =>
                      onUpdateEdge({ data: { ...selectedEdge.data, width: v } })
                    }
                  />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: "badge",
            label: "Pastille",
            children: (
              <Form layout="vertical">
                <Form.Item label="Texte (ex: 4)" style={{ marginBottom: 10 }}>
                  <Input
                    value={String(selectedEdge.data?.badgeText || "")}
                    onChange={(e) =>
                      onUpdateEdge({
                        data: { ...selectedEdge.data, badgeText: e.target.value },
                      })
                    }
                  />
                </Form.Item>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <Form.Item label="Texte" style={{ marginBottom: 0 }}>
                    <Input
                      type="color"
                      value={String(selectedEdge.data?.badgeColor || "#0ea5e9")}
                      onChange={(e) =>
                        onUpdateEdge({
                          data: { ...selectedEdge.data, badgeColor: e.target.value },
                        })
                      }
                    />
                  </Form.Item>
                  <Form.Item label="Fond" style={{ marginBottom: 0 }}>
                    <Input
                      type="color"
                      value={String(selectedEdge.data?.badgeBg || "#ffffff")}
                      onChange={(e) =>
                        onUpdateEdge({
                          data: { ...selectedEdge.data, badgeBg: e.target.value },
                        })
                      }
                    />
                  </Form.Item>
                </div>
              </Form>
            ),
          },
        ]}
      />
    );
  }

  return (
    <div style={{ color: "#64748b" }}>
      Clique un nœud ou un lien pour ouvrir l'inspector.
    </div>
  );
}

// ─── Legend Panel ────────────────────────────────────────────────────────────

type LegendPanelProps = {
  legend: LegendItem[];
  onReset: () => void;
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<LegendItem>) => void;
  onDelete: (index: number) => void;
};

function LegendPanel({ legend, onReset, onAdd, onUpdate, onDelete }: LegendPanelProps) {
  return (
    <>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        Cette légende est sauvegardée dans le logigramme (et réutilisée côté Preview).
      </div>

      <Space wrap style={{ marginBottom: 10 }}>
        <Button onClick={onReset}>Preset 1..6</Button>
        <Button type="primary" onClick={onAdd}>
          Ajouter
        </Button>
      </Space>

      <div style={{ display: "grid", gap: 10 }}>
        {legend.map((item, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 10,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <Space size={10}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    background: item.color || "#0ea5e9",
                    boxShadow: "0 0 0 4px rgba(2,6,23,0.04)",
                    display: "inline-block",
                  }}
                />
                <Typography.Text strong style={{ fontSize: 13 }}>
                  {item.key} — {item.label}
                </Typography.Text>
              </Space>
              <Button danger size="small" onClick={() => onDelete(idx)}>
                Suppr.
              </Button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "90px 1fr",
                gap: 10,
                marginTop: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Key</div>
                <Input
                  value={item.key}
                  onChange={(e) => onUpdate(idx, { key: e.target.value })}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Label</div>
                <Input
                  value={item.label}
                  onChange={(e) => onUpdate(idx, { label: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Color</div>
                <Input
                  type="color"
                  value={item.color || "#0ea5e9"}
                  onChange={(e) => onUpdate(idx, { color: e.target.value })}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Background (opt)</div>
                <Input
                  type="color"
                  value={item.bg || "#ffffff"}
                  onChange={(e) => onUpdate(idx, { bg: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Help Panel ──────────────────────────────────────────────────────────────

function HelpPanel() {
  return (
    <div style={{ fontSize: 13, lineHeight: 1.55 }}>
      <b>Workflow recommandé</b>
      <br />
      1) Ajoute les étapes dans SIPOC
      <br />
      2) Sync SIPOC → nodes
      <br />
      3) Place les nœuds + crée les liens
      <br />
      4) Enregistrer
      <Divider />
      <b>Connecteur</b>
      <br />
      1→N : une source vers plusieurs cibles
      <br />
      Chaîne : la source suit la cible
      <br />
      ESC : quitter
    </div>
  );
}

export default memo(Inspector);
