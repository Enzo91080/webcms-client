import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExportOutlined,
  ImportOutlined,
  RedoOutlined,
  ScissorOutlined,
  UndoOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { Button, Divider, Dropdown, Input, InputNumber, Select, Space, Switch, Tooltip } from "antd";
import type { MenuProps } from "antd";
import { memo, useCallback } from "react";
import { toPng } from "html-to-image";
import type { Node, Edge } from "reactflow";
import type { ShapeNodeData, OrthogonalEdgeData } from "../model/types";
import type { AlignDirection, DistributeDirection } from "../commands";

type ToolbarProps = {
  autoSync: boolean;
  saving: boolean;
  dirty: boolean;
  selectedCount: number;
  guidesEnabled: boolean;
  orthogonalEdges: boolean;

  selectedNode: Node<ShapeNodeData> | null;
  selectedEdge: Edge<OrthogonalEdgeData> | null;

  canUndo: () => boolean;
  canRedo: () => boolean;
  onAutoSyncChange: (v: boolean) => void;
  onGuidesChange: (v: boolean) => void;
  onOrthogonalChange: (v: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlign: (d: AlignDirection) => void;
  onDistribute: (d: DistributeDirection) => void;
  canAlign: () => boolean;
  canDistribute: () => boolean;
  onSyncFromSipoc: () => void;
  onRebuildFlow: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  onSave: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;

  onUpdateNode: (patch: Partial<ShapeNodeData>) => void;
  onUpdateNodeStyle: (patch: Record<string, any>) => void;
  onUpdateEdge: (patch: any) => void;
  onDeleteEdge: () => void;
};

// compact inline label
const L = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{children}</span>
);

function Toolbar(props: ToolbarProps) {
  const {
    saving, dirty, selectedCount, guidesEnabled, orthogonalEdges, autoSync,
    selectedNode, selectedEdge,
    canUndo, canRedo,
    onAutoSyncChange, onGuidesChange, onOrthogonalChange,
    onUndo, onRedo, onCopy, onPaste, onDuplicate, onDelete,
    onAlign, onDistribute, canAlign, canDistribute,
    onSyncFromSipoc, onRebuildFlow, onAutoLayout, onFitView, onSave,
    onExportJSON, onImportJSON,
    onUpdateNode, onUpdateNodeStyle, onUpdateEdge, onDeleteEdge,
  } = props;

  const handleExportPNG = useCallback(() => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2 }).then((url) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "logigramme.png";
      a.click();
    });
  }, []);

  const alignMenu: MenuProps["items"] = [
    { key: "left", icon: <AlignLeftOutlined />, label: "Gauche", disabled: !canAlign(), onClick: () => onAlign("left") },
    { key: "center", icon: <AlignCenterOutlined />, label: "Centre H", disabled: !canAlign(), onClick: () => onAlign("center") },
    { key: "right", icon: <AlignRightOutlined />, label: "Droite", disabled: !canAlign(), onClick: () => onAlign("right") },
    { type: "divider" },
    { key: "top", icon: <VerticalAlignTopOutlined />, label: "Haut", disabled: !canAlign(), onClick: () => onAlign("top") },
    { key: "middle", icon: <VerticalAlignMiddleOutlined />, label: "Centre V", disabled: !canAlign(), onClick: () => onAlign("middle") },
    { key: "bottom", icon: <VerticalAlignBottomOutlined />, label: "Bas", disabled: !canAlign(), onClick: () => onAlign("bottom") },
  ];

  const distMenu: MenuProps["items"] = [
    { key: "h", label: "Horizontal", disabled: !canDistribute(), onClick: () => onDistribute("horizontal") },
    { key: "v", label: "Vertical", disabled: !canDistribute(), onClick: () => onDistribute("vertical") },
  ];

  const exportMenu: MenuProps["items"] = [
    { key: "png", icon: <DownloadOutlined />, label: "Export PNG", onClick: handleExportPNG },
    { key: "json", icon: <ExportOutlined />, label: "Export JSON", onClick: onExportJSON },
    { key: "import", icon: <ImportOutlined />, label: "Import JSON", onClick: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (f) onImportJSON(f);
      };
      input.click();
    }},
  ];

  const nd = selectedNode?.data;
  const nst = nd?.style || {};
  const ed = selectedEdge?.data;

  return (
    <div style={{ borderBottom: "1px solid #e5e7eb", background: "#f8fafc" }}>
      {/* ── Row 1 : Actions ──────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", flexWrap: "wrap" }}>
        {/* Dirty indicator */}
        <div style={{ width: 8, height: 8, borderRadius: 4, background: dirty ? "#f59e0b" : "#22c55e", flexShrink: 0 }} />

        <Tooltip title="Annuler (Ctrl+Z)">
          <Button icon={<UndoOutlined />} onClick={onUndo} disabled={!canUndo()} size="small" type="text" />
        </Tooltip>
        <Tooltip title="Rétablir (Ctrl+Y)">
          <Button icon={<RedoOutlined />} onClick={onRedo} disabled={!canRedo()} size="small" type="text" />
        </Tooltip>

        <Divider type="vertical" style={{ margin: "0 2px" }} />

        <Tooltip title="Copier">
          <Button icon={<CopyOutlined />} onClick={onCopy} disabled={selectedCount === 0} size="small" type="text" />
        </Tooltip>
        <Tooltip title="Dupliquer">
          <Button icon={<ScissorOutlined />} onClick={onDuplicate} disabled={selectedCount === 0} size="small" type="text" />
        </Tooltip>
        <Tooltip title="Supprimer">
          <Button icon={<DeleteOutlined />} onClick={onDelete} disabled={selectedCount === 0} size="small" type="text" danger />
        </Tooltip>

        <Divider type="vertical" style={{ margin: "0 2px" }} />

        <Dropdown menu={{ items: alignMenu }} trigger={["click"]}>
          <Button size="small" type="text" disabled={!canAlign()}>Aligner</Button>
        </Dropdown>
        <Dropdown menu={{ items: distMenu }} trigger={["click"]}>
          <Button size="small" type="text" disabled={!canDistribute()}>Distribuer</Button>
        </Dropdown>

        <Divider type="vertical" style={{ margin: "0 2px" }} />

        <Button onClick={onSyncFromSipoc} size="small" type="text">Sync SIPOC</Button>
        <Button onClick={onRebuildFlow} size="small" type="text">Flux</Button>
        <Button onClick={onAutoLayout} size="small" type="text">Layout</Button>
        <Button onClick={onFitView} size="small" type="text">Fit</Button>

        <Divider type="vertical" style={{ margin: "0 2px" }} />

        <Space size={4}>
          <Switch size="small" checked={guidesEnabled} onChange={onGuidesChange} />
          <L>Guides</L>
        </Space>
        <Space size={4}>
          <Switch size="small" checked={orthogonalEdges} onChange={onOrthogonalChange} />
          <L>Ortho</L>
        </Space>
        <Space size={4}>
          <Switch size="small" checked={autoSync} onChange={onAutoSyncChange} />
          <L>Sync</L>
        </Space>

        <div style={{ flex: 1 }} />

        <Dropdown menu={{ items: exportMenu }} trigger={["click"]}>
          <Button icon={<ExportOutlined />} size="small">Export</Button>
        </Dropdown>
        <Button type="primary" size="small" onClick={onSave} loading={saving}>
          {dirty ? "Enregistrer *" : "Enregistrer"}
        </Button>
      </div>

      {/* ── Row 2 : Contextual properties ────────────────────── */}
      {selectedNode && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderTop: "1px solid #e5e7eb", background: "#fff", flexWrap: "wrap" }}>
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
            style={{ width: 110 }}
            value={String(nd?.shape || "rectangle")}
            onChange={(v) => onUpdateNode({ shape: v as any })}
            options={[
              { value: "rectangle", label: "Rectangle" },
              { value: "diamond", label: "Losange" },
              { value: "circle", label: "Cercle" },
              { value: "diamond-x", label: "Losange ✕" },
            ]}
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
          <InputNumber size="small" style={{ width: 60 }} min={80} max={520} value={Number(nst.width || 220)} onChange={(v) => onUpdateNodeStyle({ width: v })} />
          <L>H</L>
          <InputNumber size="small" style={{ width: 60 }} min={40} max={360} value={Number(nst.height || 64)} onChange={(v) => onUpdateNodeStyle({ height: v })} />
          <L>Font</L>
          <InputNumber size="small" style={{ width: 55 }} min={8} max={32} value={Number(nst.fontSize || 13)} onChange={(v) => onUpdateNodeStyle({ fontSize: v })} />
        </div>
      )}

      {selectedEdge && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderTop: "1px solid #e5e7eb", background: "#fff", flexWrap: "wrap" }}>
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

          <div style={{ flex: 1 }} />

          <Button size="small" danger onClick={onDeleteEdge}>Supprimer lien</Button>
        </div>
      )}
    </div>
  );
}

export default memo(Toolbar);
