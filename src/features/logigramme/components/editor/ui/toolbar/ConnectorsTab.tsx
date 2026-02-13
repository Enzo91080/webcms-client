import { Button, Divider, Input, InputNumber, Select, Space, Switch } from "antd";
import type { Edge } from "reactflow";
import type { ArrowheadStyle, OrthogonalEdgeData, ConnectMode } from "../../model/types";

const ARROWHEAD_OPTIONS = [
  { value: "none", label: "Aucune" },
  { value: "arrow", label: "Flèche" },
  { value: "arrowclosed", label: "Flèche pleine" },
  { value: "diamond", label: "Losange" },
  { value: "circle", label: "Cercle" },
];

const L = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{children}</span>
);

type ConnectorsTabProps = {
  orthogonalEdges: boolean;
  onOrthogonalChange: (v: boolean) => void;
  connectMode: ConnectMode;
  onToggleConnectMode: (mode: ConnectMode) => void;
  selectedEdge: Edge<OrthogonalEdgeData> | null;
  onUpdateEdge: (patch: any) => void;
  onDeleteEdge: () => void;
};

export default function ConnectorsTab({
  orthogonalEdges, onOrthogonalChange,
  connectMode, onToggleConnectMode,
  selectedEdge, onUpdateEdge, onDeleteEdge,
}: ConnectorsTabProps) {
  const ed = selectedEdge?.data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Connect mode + orthogonal toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <L>Mode connexion</L>
        <Button
          size="small"
          type={connectMode === "fanout" ? "primary" : "default"}
          onClick={() => onToggleConnectMode("fanout")}
        >
          1→N
        </Button>
        <Button
          size="small"
          type={connectMode === "chain" ? "primary" : "default"}
          onClick={() => onToggleConnectMode("chain")}
        >
          Chaîne
        </Button>

        <Divider type="vertical" style={{ margin: "0 4px" }} />

        <Space size={4}>
          <Switch size="small" checked={orthogonalEdges} onChange={onOrthogonalChange} />
          <L>Orthogonal</L>
        </Space>
      </div>

      {/* Edge properties when selected */}
      {selectedEdge && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "4px 0", borderTop: "1px solid #f0f0f0" }}>
          <L>Type</L>
          <Select
            size="small"
            style={{ width: 120 }}
            value={String(selectedEdge.type || "orthogonal")}
            onChange={(v) => onUpdateEdge({ type: v })}
            options={[
              { value: "orthogonal", label: "Orthogonal" },
              { value: "step", label: "Step" },
              { value: "default", label: "Courbe" },
            ]}
          />

          <L>Couleur</L>
          <input
            type="color"
            value={String(ed?.color || "#f59ad5")}
            onChange={(e) => onUpdateEdge({ data: { ...ed, color: e.target.value } })}
            style={{ width: 28, height: 24, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", padding: 0 }}
          />

          <L>Épaisseur</L>
          <InputNumber size="small" style={{ width: 55 }} min={1} max={8} value={Number(ed?.width || 2)} onChange={(v) => onUpdateEdge({ data: { ...ed, width: v } })} />

          <L>Libellé</L>
          <Input
            size="small"
            style={{ width: 100 }}
            value={String((selectedEdge as any).label || "")}
            onChange={(e) => onUpdateEdge({ label: e.target.value })}
          />

          <Divider type="vertical" style={{ margin: "0 2px" }} />

          <L>Pastille</L>
          <Input
            size="small"
            style={{ width: 50 }}
            placeholder="ex: 4"
            value={String(ed?.badgeText || "")}
            onChange={(e) => onUpdateEdge({ data: { ...ed, badgeText: e.target.value } })}
          />
          <input
            type="color"
            value={String(ed?.badgeColor || ed?.color || "#0ea5e9")}
            onChange={(e) => onUpdateEdge({ data: { ...ed, badgeColor: e.target.value } })}
            style={{ width: 28, height: 24, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", padding: 0 }}
          />

          <Divider type="vertical" style={{ margin: "0 2px" }} />

          <L>Début</L>
          <Select
            size="small"
            style={{ width: 110 }}
            value={ed?.arrowStart || "none"}
            onChange={(v) => onUpdateEdge({ data: { ...ed, arrowStart: v as ArrowheadStyle } })}
            options={ARROWHEAD_OPTIONS}
          />
          <L>Fin</L>
          <Select
            size="small"
            style={{ width: 110 }}
            value={ed?.arrowEnd || "arrowclosed"}
            onChange={(v) => onUpdateEdge({ data: { ...ed, arrowEnd: v as ArrowheadStyle } })}
            options={ARROWHEAD_OPTIONS}
          />

          <div style={{ flex: 1 }} />
          <Button size="small" danger onClick={onDeleteEdge}>Supprimer lien</Button>
        </div>
      )}
    </div>
  );
}
