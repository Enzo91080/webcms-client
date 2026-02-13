import { Divider, Input, InputNumber, Select, Slider, Switch, Space } from "antd";
import type { Node } from "reactflow";
import type { ShapeNodeData } from "../../model/types";
import { getAllShapes } from "../../../nodes/shapes";

const L = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{children}</span>
);

type StylesTabProps = {
  selectedNode: Node<ShapeNodeData> | null;
  onUpdateNode: (patch: Partial<ShapeNodeData>) => void;
  onUpdateNodeStyle: (patch: Record<string, any>) => void;
};

export default function StylesTab({
  selectedNode, onUpdateNode, onUpdateNodeStyle,
}: StylesTabProps) {
  if (!selectedNode) {
    return <div style={{ color: "#94a3b8", fontSize: 12 }}>Sélectionne un nœud pour modifier ses styles.</div>;
  }

  const nd = selectedNode.data;
  const nst = nd?.style || {};

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <L>Libellé</L>
      <Input
        size="small"
        style={{ width: 140 }}
        value={String(nd?.label || "")}
        onChange={(e) => onUpdateNode({ label: e.target.value })}
      />

      <L>Forme</L>
      <Select
        size="small"
        style={{ width: 160 }}
        value={String(nd?.shape || "rectangle")}
        onChange={(v) => onUpdateNode({ shape: v as any })}
        showSearch
        optionFilterProp="label"
        options={getAllShapes().map((s) => ({ value: s.key, label: s.label }))}
      />

      <Divider type="vertical" style={{ margin: "0 2px" }} />

      <L>Fond</L>
      <input
        type="color"
        value={String(nst.fill || "#ffffff")}
        onChange={(e) => onUpdateNodeStyle({ fill: e.target.value })}
        style={{ width: 28, height: 24, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", padding: 0 }}
      />
      <L>Contour</L>
      <input
        type="color"
        value={String(nst.stroke || "#cbd5e1")}
        onChange={(e) => onUpdateNodeStyle({ stroke: e.target.value })}
        style={{ width: 28, height: 24, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", padding: 0 }}
      />
      <L>Texte</L>
      <input
        type="color"
        value={String(nst.text || "#0f172a")}
        onChange={(e) => onUpdateNodeStyle({ text: e.target.value })}
        style={{ width: 28, height: 24, border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", padding: 0 }}
      />

      <Divider type="vertical" style={{ margin: "0 2px" }} />

      <L>L</L>
      <InputNumber size="small" style={{ width: 60 }} min={40} max={520} value={Number(nst.width || 220)} onChange={(v) => onUpdateNodeStyle({ width: v })} />
      <L>H</L>
      <InputNumber size="small" style={{ width: 60 }} min={40} max={360} value={Number(nst.height || 64)} onChange={(v) => onUpdateNodeStyle({ height: v })} />
      <L>Font</L>
      <InputNumber size="small" style={{ width: 55 }} min={8} max={32} value={Number(nst.fontSize || 13)} onChange={(v) => onUpdateNodeStyle({ fontSize: v })} />

      <Divider type="vertical" style={{ margin: "0 2px" }} />

      <L>Radius</L>
      <InputNumber size="small" style={{ width: 50 }} min={0} max={50} value={nst.borderRadius ?? 10} onChange={(v) => onUpdateNodeStyle({ borderRadius: v })} />
      <L>Opacité</L>
      <Slider
        min={0.1}
        max={1}
        step={0.05}
        value={nst.opacity ?? 1}
        onChange={(v) => onUpdateNodeStyle({ opacity: v })}
        style={{ width: 60, margin: "0 4px" }}
      />
      <Space size={4}>
        <Switch size="small" checked={nst.shadow !== false} onChange={(v) => onUpdateNodeStyle({ shadow: v })} />
        <L>Ombre</L>
      </Space>
    </div>
  );
}
