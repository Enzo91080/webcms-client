import type { SipocRow } from "../../../types";
import { useLogigrammeEditor } from "./state/useLogigrammeEditor";
import Toolbar from "./ui/Toolbar";
import Canvas from "./ui/Canvas";
import Inspector from "./ui/Inspector";

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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 12 }}>
      {/* Canvas + Toolbar */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
        }}
      >
        <Toolbar
          // State
          autoSync={editor.autoSync}
          connectMode={editor.connectMode}
          connectSourceId={editor.connectSourceId}
          saving={editor.saving}
          dirty={editor.dirty}
          selectedCount={editor.selectedCount}
          // Feature toggles
          guidesEnabled={editor.guidesEnabled}
          orthogonalEdges={editor.orthogonalEdges}
          // History
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onUndo={editor.undo}
          onRedo={editor.redo}
          // Callbacks - state
          onAutoSyncChange={editor.setAutoSync}
          onGuidesChange={editor.setGuidesEnabled}
          onOrthogonalChange={editor.setOrthogonalEdges}
          // Callbacks - clipboard
          onCopy={editor.copy}
          onPaste={editor.paste}
          onDuplicate={editor.duplicate}
          onDelete={editor.deleteSelection}
          // Callbacks - align/distribute
          onAlign={editor.align}
          onDistribute={editor.distribute}
          canAlign={editor.canAlign}
          canDistribute={editor.canDistribute}
          // Callbacks - legacy
          onSyncFromSipoc={editor.syncFromSipoc}
          onRebuildFlow={editor.rebuildDefaultFlow}
          onAutoLayout={editor.autoLayout}
          onFitView={editor.fitView}
          onToggleConnectMode={editor.toggleConnectMode}
          onExitConnectMode={editor.exitConnectMode}
          onSave={editor.save}
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
        />
      </div>

      {/* Inspector */}
      <Inspector
        selectedNode={editor.selectedNode}
        selectedEdge={editor.selectedEdge}
        legend={editor.legend}
        onUpdateNode={editor.updateSelectedNode}
        onUpdateNodeStyle={editor.updateSelectedNodeStyle}
        onUpdateEdge={editor.updateSelectedEdge}
        onDeleteEdge={editor.deleteSelectedEdge}
        onResetLegend={editor.resetLegend}
        onAddLegendItem={editor.addLegendItem}
        onUpdateLegendItem={editor.updateLegendItem}
        onDeleteLegendItem={editor.deleteLegendItem}
      />
    </div>
  );
}
