import type { SipocRow } from "../../../../shared/types";
import { useLogigrammeEditor } from "./state/useLogigrammeEditor";
import ToolbarTabs from "./ui/ToolbarTabs";
import Canvas from "./ui/Canvas";
import ShapePalette from "./ui/ShapePalette";
import ContextMenu from "./ui/ContextMenu";

type LogigrammeEditorProps = {
  processId: string;
  sipocRows: SipocRow[];
  initial: any | undefined;
  onSaved?: (logi: any) => void;
};

export default function LogigrammeEditor({
  processId,
  sipocRows,
  initial,
  onSaved,
}: LogigrammeEditorProps) {
  const editor = useLogigrammeEditor({
    processId,
    sipocRows,
    initial,
    onSaved,
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0 }}>
      {/* Palette de formes (DnD) */}
      <div
        style={{
          borderRight: "1px solid #e5e7eb",
          background: "#fafbfc",
          overflow: "auto",
        }}
      >
        <ShapePalette />
      </div>

      {/* Toolbar + Canvas */}
      <div style={{ overflow: "hidden", background: "#fff" }}>
        <ToolbarTabs
          nodes={editor.nodes}
          edges={editor.edges}
          autoSync={editor.autoSync}
          saving={editor.saving}
          dirty={editor.dirty}
          selectedCount={editor.selectedCount}
          guidesEnabled={editor.guidesEnabled}
          orthogonalEdges={editor.orthogonalEdges}
          connectMode={editor.connectMode}
          selectedNode={editor.selectedNode}
          selectedEdge={editor.selectedEdge}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onAutoSyncChange={editor.setAutoSync}
          onGuidesChange={editor.setGuidesEnabled}
          onOrthogonalChange={editor.setOrthogonalEdges}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onCopy={editor.copy}
          onPaste={editor.paste}
          onDuplicate={editor.duplicate}
          onDelete={editor.deleteSelection}
          onAlign={editor.align}
          onDistribute={editor.distribute}
          canAlign={editor.canAlign}
          canDistribute={editor.canDistribute}
          onSyncFromSipoc={editor.syncFromSipoc}
          onRebuildFlow={editor.rebuildDefaultFlow}
          onAutoLayout={editor.autoLayout}
          onFitView={editor.fitView}
          onSave={editor.save}
          onExportJSON={editor.exportJSON}
          onImportJSON={editor.importJSON}
          onToggleConnectMode={editor.toggleConnectMode}
          onUpdateNode={editor.updateSelectedNode}
          onUpdateNodeStyle={editor.updateSelectedNodeStyle}
          onUpdateEdge={editor.updateSelectedEdge}
          onDeleteEdge={editor.deleteSelectedEdge}
        />

        <Canvas
          nodes={editor.nodes}
          edges={editor.edges}
          guides={editor.guides}
          orthogonalEdges={editor.orthogonalEdges}
          onNodesChange={editor.onNodesChange}
          onNodeDragStop={editor.onNodeDragStop}
          onEdgesChange={editor.onEdgesChange}
          onConnect={editor.onConnect}
          onInit={editor.onInit}
          onNodeClick={editor.onNodeClick}
          onEdgeClick={editor.onEdgeClick}
          onPaneClick={editor.onPaneClick}
          onSelectionChange={editor.onSelectionChange}
          onDropNode={editor.addNode}
          onNodeContextMenu={editor.onNodeContextMenu}
          onPaneContextMenu={editor.onPaneContextMenu}
        />
      </div>

      {/* Context Menu */}
      <ContextMenu
        state={editor.contextMenu}
        onClose={editor.closeContextMenu}
        selectedCount={editor.selectedCount}
        hasLockedSelection={editor.hasLockedSelection}
        onCopy={editor.copy}
        onDuplicate={editor.duplicate}
        onDelete={editor.deleteSelection}
        onGroup={editor.group}
        onUngroup={editor.ungroup}
        onLock={editor.lock}
        onUnlock={editor.unlock}
        onBringToFront={editor.bringToFront}
        onSendToBack={editor.sendToBack}
      />
    </div>
  );
}
