import { Tabs } from "antd";
import { memo } from "react";
import type { Node, Edge } from "reactflow";
import type { ShapeNodeData, OrthogonalEdgeData, ConnectMode } from "../model/types";
import type { AlignDirection, DistributeDirection } from "../commands";
import ActionsTab from "./toolbar/ActionsTab";
import ConnectorsTab from "./toolbar/ConnectorsTab";
import StylesTab from "./toolbar/StylesTab";
import SipocTab from "./toolbar/SipocTab";
import ExportTab from "./toolbar/ExportTab";
import ValidationPanel from "./ValidationPanel";

type ToolbarTabsProps = {
  nodes: Node<ShapeNodeData>[];
  edges: Edge<OrthogonalEdgeData>[];
  autoSync: boolean;
  saving: boolean;
  dirty: boolean;
  selectedCount: number;
  guidesEnabled: boolean;
  orthogonalEdges: boolean;
  connectMode: ConnectMode;

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
  onToggleConnectMode: (mode: ConnectMode) => void;

  onUpdateNode: (patch: Partial<ShapeNodeData>) => void;
  onUpdateNodeStyle: (patch: Record<string, any>) => void;
  onUpdateEdge: (patch: any) => void;
  onDeleteEdge: () => void;
};

function ToolbarTabs(props: ToolbarTabsProps) {
  return (
    <div style={{ borderBottom: "1px solid #e5e7eb", background: "#f8fafc" }}>
      {/* Dirty indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: props.dirty ? "#f59e0b" : "#22c55e",
            flexShrink: 0,
            marginTop: 8,
          }}
        />
        <Tabs
          size="small"
          style={{ flex: 1, marginBottom: 0 }}
          tabBarStyle={{ marginBottom: 0 }}
          items={[
            {
              key: "actions",
              label: "Actions",
              children: (
                <div style={{ padding: "6px 0" }}>
                  <ActionsTab
                    canUndo={props.canUndo}
                    canRedo={props.canRedo}
                    selectedCount={props.selectedCount}
                    onUndo={props.onUndo}
                    onRedo={props.onRedo}
                    onCopy={props.onCopy}
                    onPaste={props.onPaste}
                    onDuplicate={props.onDuplicate}
                    onDelete={props.onDelete}
                    onAlign={props.onAlign}
                    onDistribute={props.onDistribute}
                    canAlign={props.canAlign}
                    canDistribute={props.canDistribute}
                  />
                </div>
              ),
            },
            {
              key: "connectors",
              label: "Connecteurs",
              children: (
                <div style={{ padding: "6px 0" }}>
                  <ConnectorsTab
                    orthogonalEdges={props.orthogonalEdges}
                    onOrthogonalChange={props.onOrthogonalChange}
                    connectMode={props.connectMode}
                    onToggleConnectMode={props.onToggleConnectMode}
                    selectedEdge={props.selectedEdge}
                    onUpdateEdge={props.onUpdateEdge}
                    onDeleteEdge={props.onDeleteEdge}
                  />
                </div>
              ),
            },
            {
              key: "styles",
              label: "Styles",
              children: (
                <div style={{ padding: "6px 0" }}>
                  <StylesTab
                    selectedNode={props.selectedNode}
                    onUpdateNode={props.onUpdateNode}
                    onUpdateNodeStyle={props.onUpdateNodeStyle}
                  />
                </div>
              ),
            },
            {
              key: "sipoc",
              label: "SIPOC / Layout",
              children: (
                <div style={{ padding: "6px 0" }}>
                  <SipocTab
                    autoSync={props.autoSync}
                    guidesEnabled={props.guidesEnabled}
                    onAutoSyncChange={props.onAutoSyncChange}
                    onGuidesChange={props.onGuidesChange}
                    onSyncFromSipoc={props.onSyncFromSipoc}
                    onRebuildFlow={props.onRebuildFlow}
                    onAutoLayout={props.onAutoLayout}
                    onFitView={props.onFitView}
                  />
                </div>
              ),
            },
            {
              key: "validation",
              label: "Validation",
              children: (
                <div style={{ padding: "6px 0", maxHeight: 120, overflowY: "auto" }}>
                  <ValidationPanel
                    nodes={props.nodes}
                    edges={props.edges}
                  />
                </div>
              ),
            },
            {
              key: "export",
              label: "Export",
              children: (
                <div style={{ padding: "6px 0" }}>
                  <ExportTab
                    saving={props.saving}
                    dirty={props.dirty}
                    onSave={props.onSave}
                    onExportJSON={props.onExportJSON}
                    onImportJSON={props.onImportJSON}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

export default memo(ToolbarTabs);
