import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  CopyOutlined,
  DeleteOutlined,
  RedoOutlined,
  ScissorOutlined,
  UndoOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { Button, Divider, Dropdown, Space, Switch, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import { memo } from "react";
import type { ConnectMode } from "../model/types";
import type { AlignDirection, DistributeDirection } from "../commands";

type ToolbarProps = {
  // State
  autoSync: boolean;
  connectMode: ConnectMode;
  connectSourceId: string | null;
  saving: boolean;
  dirty: boolean;
  selectedCount: number;

  // Feature toggles
  guidesEnabled: boolean;
  orthogonalEdges: boolean;

  // History
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Callbacks - state
  onAutoSyncChange: (value: boolean) => void;
  onGuidesChange: (value: boolean) => void;
  onOrthogonalChange: (value: boolean) => void;

  // Callbacks - history
  onUndo: () => void;
  onRedo: () => void;

  // Callbacks - clipboard
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;

  // Callbacks - align/distribute
  onAlign: (direction: AlignDirection) => void;
  onDistribute: (direction: DistributeDirection) => void;
  canAlign: () => boolean;
  canDistribute: () => boolean;

  // Callbacks - legacy
  onSyncFromSipoc: () => void;
  onRebuildFlow: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  onToggleConnectMode: (mode: ConnectMode) => void;
  onExitConnectMode: () => void;
  onSave: () => void;
};

function Toolbar({
  autoSync,
  connectMode,
  connectSourceId,
  saving,
  dirty,
  selectedCount,
  guidesEnabled,
  orthogonalEdges,
  canUndo,
  canRedo,
  onAutoSyncChange,
  onGuidesChange,
  onOrthogonalChange,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onAlign,
  onDistribute,
  canAlign,
  canDistribute,
  onSyncFromSipoc,
  onRebuildFlow,
  onAutoLayout,
  onFitView,
  onToggleConnectMode,
  onExitConnectMode,
  onSave,
}: ToolbarProps) {
  // Align dropdown menu
  const alignMenuItems: MenuProps["items"] = [
    {
      key: "left",
      icon: <AlignLeftOutlined />,
      label: "Aligner à gauche",
      disabled: !canAlign(),
      onClick: () => onAlign("left"),
    },
    {
      key: "center",
      icon: <AlignCenterOutlined />,
      label: "Centrer horizontalement",
      disabled: !canAlign(),
      onClick: () => onAlign("center"),
    },
    {
      key: "right",
      icon: <AlignRightOutlined />,
      label: "Aligner à droite",
      disabled: !canAlign(),
      onClick: () => onAlign("right"),
    },
    { type: "divider" },
    {
      key: "top",
      icon: <VerticalAlignTopOutlined />,
      label: "Aligner en haut",
      disabled: !canAlign(),
      onClick: () => onAlign("top"),
    },
    {
      key: "middle",
      icon: <VerticalAlignMiddleOutlined />,
      label: "Centrer verticalement",
      disabled: !canAlign(),
      onClick: () => onAlign("middle"),
    },
    {
      key: "bottom",
      icon: <VerticalAlignBottomOutlined />,
      label: "Aligner en bas",
      disabled: !canAlign(),
      onClick: () => onAlign("bottom"),
    },
  ];

  // Distribute dropdown menu
  const distributeMenuItems: MenuProps["items"] = [
    {
      key: "horizontal",
      label: "Distribuer horizontalement",
      disabled: !canDistribute(),
      onClick: () => onDistribute("horizontal"),
    },
    {
      key: "vertical",
      label: "Distribuer verticalement",
      disabled: !canDistribute(),
      onClick: () => onDistribute("vertical"),
    },
  ];

  return (
    <div
      style={{
        padding: 12,
        borderBottom: "1px solid #e5e7eb",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Left: Title + dirty indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              background: dirty ? "#f59e0b" : "#0ea5e9",
            }}
          />
          <div>
            <Typography.Text strong style={{ fontSize: 14 }}>
              Logigramme {dirty && <span style={{ color: "#f59e0b" }}>*</span>}
            </Typography.Text>
            <div style={{ fontSize: 11, opacity: 0.65 }}>
              {selectedCount > 0 ? `${selectedCount} sélectionné(s)` : "Aucune sélection"}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <Space align="center" wrap size={4}>
          {/* Undo/Redo */}
          <Tooltip title="Annuler (Ctrl+Z)">
            <Button icon={<UndoOutlined />} onClick={onUndo} disabled={!canUndo()} size="small" />
          </Tooltip>
          <Tooltip title="Rétablir (Ctrl+Y)">
            <Button icon={<RedoOutlined />} onClick={onRedo} disabled={!canRedo()} size="small" />
          </Tooltip>

          <Divider type="vertical" />

          {/* Clipboard */}
          <Tooltip title="Copier (Ctrl+C)">
            <Button icon={<CopyOutlined />} onClick={onCopy} disabled={selectedCount === 0} size="small" />
          </Tooltip>
          <Tooltip title="Dupliquer (Ctrl+D)">
            <Button icon={<ScissorOutlined />} onClick={onDuplicate} disabled={selectedCount === 0} size="small" />
          </Tooltip>
          <Tooltip title="Supprimer (Suppr)">
            <Button icon={<DeleteOutlined />} onClick={onDelete} disabled={selectedCount === 0} size="small" danger />
          </Tooltip>

          <Divider type="vertical" />

          {/* Align & Distribute */}
          <Dropdown menu={{ items: alignMenuItems }} trigger={["click"]}>
            <Button size="small" disabled={!canAlign()}>
              Aligner
            </Button>
          </Dropdown>
          <Dropdown menu={{ items: distributeMenuItems }} trigger={["click"]}>
            <Button size="small" disabled={!canDistribute()}>
              Distribuer
            </Button>
          </Dropdown>

          <Divider type="vertical" />

          {/* Toggles */}
          <Space
            size={6}
            style={{
              padding: "4px 8px",
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <Tooltip title="Guides d'alignement">
              <Switch size="small" checked={guidesEnabled} onChange={onGuidesChange} />
            </Tooltip>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Guides</span>
          </Space>

          <Space
            size={6}
            style={{
              padding: "4px 8px",
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <Tooltip title="Edges orthogonaux (Visio-style)">
              <Switch size="small" checked={orthogonalEdges} onChange={onOrthogonalChange} />
            </Tooltip>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Ortho</span>
          </Space>

          <Space
            size={6}
            style={{
              padding: "4px 8px",
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <Switch size="small" checked={autoSync} onChange={onAutoSyncChange} />
            <span style={{ fontSize: 11, opacity: 0.8 }}>Sync</span>
          </Space>

          <Divider type="vertical" />

          {/* SIPOC actions */}
          <Button onClick={onSyncFromSipoc} size="small">
            Sync SIPOC
          </Button>
          <Button onClick={onRebuildFlow} size="small">
            Flux
          </Button>
          <Button onClick={onAutoLayout} size="small">
            Layout
          </Button>
          <Button onClick={onFitView} size="small">
            Fit
          </Button>

          <Divider type="vertical" />

          {/* Connect modes */}
          <Tooltip title="1→N : source vers plusieurs cibles (ESC pour quitter)">
            <Button
              type={connectMode === "fanout" ? "primary" : "default"}
              onClick={() => onToggleConnectMode("fanout")}
              size="small"
            >
              1→N
            </Button>
          </Tooltip>

          <Tooltip title="Chaîne : la cible devient la source (ESC pour quitter)">
            <Button
              type={connectMode === "chain" ? "primary" : "default"}
              onClick={() => onToggleConnectMode("chain")}
              size="small"
            >
              Chaîne
            </Button>
          </Tooltip>

          {connectMode !== "off" && (
            <Button danger onClick={onExitConnectMode} size="small">
              Quitter
            </Button>
          )}

          <Divider type="vertical" />

          {/* Save */}
          <Button type="primary" onClick={onSave} loading={saving}>
            Enregistrer
          </Button>
        </Space>
      </div>

      {/* Connect mode banner */}
      {connectMode !== "off" && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            border: "1px solid #fed7aa",
            background: "linear-gradient(180deg, #fff7ed 0%, #fffbeb 100%)",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <b>Connecteur :</b> {connectMode === "fanout" ? "1 → N" : "Chaîne"} — Source :{" "}
            <b>{connectSourceId || "cliquez un nœud"}</b>
          </div>
          <div style={{ opacity: 0.7 }}>ESC pour quitter</div>
        </div>
      )}
    </div>
  );
}

export default memo(Toolbar);
