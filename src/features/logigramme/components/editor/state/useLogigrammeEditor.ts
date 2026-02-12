import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  ReactFlowInstance,
  useReactFlow,
} from "reactflow";
import { message } from "antd";
import { saveLogigramme } from "../../../../../shared/api";
import type { SipocRow } from "../../../../../shared/types";
import type {
  ConnectMode,
  LegendItem,
  OrthogonalEdgeData,
  ShapeNodeData,
} from "../model/types";
import { defaultLegend, defaultEdgeOptions, FIT_VIEW_PADDING, GRID_SIZE } from "../model/defaults";
import { toStored, nodeFromStored, edgeFromStored, createEdge } from "../model/mapping";
import { hasEdge, safeIdFromRow } from "../lib/ids";
import { buildFromSipoc, applyAutoLayout } from "../lib/layout";
import { calculateGuides } from "../lib/guides";
import { useHistory } from "./useHistory";
import {
  copySelection,
  pasteClipboard,
  duplicateSelection,
  deleteSelection,
  alignNodes,
  distributeNodes,
  canAlign,
  canDistribute,
  type ClipboardContent,
  type AlignDirection,
  type DistributeDirection,
} from "../commands";
import type { Guide } from "../ui/AlignmentGuides";

type UseLogigrammeEditorProps = {
  processId: string;
  sipocRows: SipocRow[];
  initial: any | undefined;
  onSaved?: (logi: any) => void;
};

export function useLogigrammeEditor({
  processId,
  sipocRows,
  initial,
  onSaved,
}: UseLogigrammeEditorProps) {
  // ─── State ───────────────────────────────────────────────────────────────
  const [nodes, setNodes] = useState<Node<ShapeNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<OrthogonalEdgeData>[]>([]);
  const [legend, setLegend] = useState<LegendItem[]>(defaultLegend());

  const [autoSync, setAutoSync] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [connectMode, setConnectMode] = useState<ConnectMode>("off");
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  // Feature toggles
  const [guidesEnabled, setGuidesEnabled] = useState(true);
  const [orthogonalEdges, setOrthogonalEdges] = useState(true);

  // Guides state
  const [guides, setGuides] = useState<Guide[]>([]);
  const draggingNodeRef = useRef<string | null>(null);

  // Clipboard
  const clipboardRef = useRef<ClipboardContent<Node<ShapeNodeData>, Edge<OrthogonalEdgeData>> | null>(null);

  // History
  const history = useHistory<Node<ShapeNodeData>, Edge<OrthogonalEdgeData>>();

  const rfRef = useRef<ReactFlowInstance | null>(null);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );

  // Get all selected node IDs (from ReactFlow selection)
  const selectedNodeIds = useMemo(() => {
    return new Set(nodes.filter((n) => n.selected).map((n) => n.id));
  }, [nodes]);

  const selectedEdgeIds = useMemo(() => {
    return new Set(edges.filter((e) => e.selected).map((e) => e.id));
  }, [edges]);

  const selectedCount = selectedNodeIds.size;

  // ─── Load initial data ───────────────────────────────────────────────────
  useEffect(() => {
    const stNodes = initial?.nodes || [];
    const stEdges = initial?.edges || [];
    const stLegend = Array.isArray(initial?.legend) ? initial.legend : defaultLegend();

    const loadedNodes = stNodes.map(nodeFromStored);
    const loadedEdges = stEdges.map(edgeFromStored).filter((e: Edge) => e.source && e.target);

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setLegend(stLegend);
    setReady(true);
    setDirty(false);

    // Initialize history
    history.initialize(loadedNodes, loadedEdges);
  }, [processId, initial]);

  // ─── Highlight connect source ────────────────────────────────────────────
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isLinkSource: connectSourceId ? n.id === connectSourceId : false,
        },
      }))
    );
  }, [connectSourceId]);

  // ─── Auto-sync SIPOC → nodes ─────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !autoSync || !sipocRows?.length) return;
    setNodes((prev) => buildFromSipoc(sipocRows, prev));
  }, [JSON.stringify(sipocRows), autoSync, ready]);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) return;

      // Escape - exit connect mode / clear selection
      if (e.key === "Escape") {
        exitConnectMode();
        clearSelection();
        return;
      }

      // Delete - delete selection
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeIds.size > 0 || selectedEdgeIds.size > 0) {
          e.preventDefault();
          handleDeleteSelection();
        }
        return;
      }

      // Ctrl+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Ctrl+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Ctrl+D - Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // Ctrl+A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nodes, edges, selectedNodeIds, selectedEdgeIds]);

  // ─── History helpers ─────────────────────────────────────────────────────
  const commitToHistory = useCallback((reason?: string) => {
    history.commit(nodes, edges, reason);
    setDirty(true);
  }, [nodes, edges, history]);

  const handleUndo = useCallback(() => {
    const snapshot = history.undo();
    if (snapshot) {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      message.info("Annulé");
    }
  }, [history]);

  const handleRedo = useCallback(() => {
    const snapshot = history.redo();
    if (snapshot) {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      message.info("Rétabli");
    }
  }, [history]);

  // ─── ReactFlow callbacks (memoized) ──────────────────────────────────────
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Track drag start/end for guides
    for (const change of changes) {
      if (change.type === "position" && change.dragging !== undefined) {
        if (change.dragging) {
          draggingNodeRef.current = change.id;
        } else {
          draggingNodeRef.current = null;
          setGuides([]);
        }
      }
    }

    // Detect dimension changes from NodeResizer
    const resizedIds = new Set<string>();
    let resizeEnded = false;
    for (const change of changes) {
      if (change.type === "dimensions") {
        resizedIds.add(change.id);
        if ((change as any).resizing === false) resizeEnded = true;
      }
    }

    setNodes((nds) => {
      let updated = applyNodeChanges(changes, nds);

      // Sync resize dimensions to data.style + node.style (so toolbar inputs update & wrapper stays sized)
      if (resizedIds.size > 0) {
        updated = updated.map((n) => {
          if (!resizedIds.has(n.id)) return n;
          const w = n.width;
          const h = n.height;
          if (w && h) {
            const rw = Math.round(w);
            const rh = Math.round(h);
            return {
              ...n,
              style: { ...(n.style || {}), width: rw, height: rh },
              data: {
                ...n.data,
                style: {
                  ...(n.data?.style || {}),
                  width: rw,
                  height: rh,
                },
              },
            };
          }
          return n;
        });
      }

      // Calculate guides during drag
      if (draggingNodeRef.current && guidesEnabled) {
        const draggingNode = updated.find((n) => n.id === draggingNodeRef.current);
        if (draggingNode) {
          const { guides: newGuides } = calculateGuides(draggingNode, updated);
          setGuides(newGuides);
        }
      }

      return updated;
    });

    // Commit to history when resize ends
    if (resizeEnded) {
      commitToHistory("resize");
    }
  }, [guidesEnabled, commitToHistory]);

  const onNodeDragStop = useCallback(() => {
    draggingNodeRef.current = null;
    setGuides([]);
    commitToHistory("move");
  }, [commitToHistory]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    const edgeOptions = orthogonalEdges
      ? defaultEdgeOptions
      : { ...defaultEdgeOptions, type: "default" };

    setEdges((eds) => addEdge({ ...connection, ...edgeOptions }, eds));
    commitToHistory("connect");
  }, [orthogonalEdges, commitToHistory]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfRef.current = instance;
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    if (connectMode !== "off") setConnectSourceId(null);
  }, [connectMode]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
    // Update single selection for inspector
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0].id);
    } else if (selectedNodes.length === 0) {
      setSelectedNodeId(null);
    }
  }, []);

  // ─── Node click (handles connect mode) ───────────────────────────────────
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (connectMode !== "off") {
        if (!connectSourceId) {
          setConnectSourceId(node.id);
          setSelectedNodeId(node.id);
          setSelectedEdgeId(null);
          return;
        }
        if (connectSourceId === node.id) {
          setConnectSourceId(null);
          return;
        }

        setEdges((prev) => {
          if (hasEdge(prev, connectSourceId, node.id)) return prev;
          return [...prev, createEdge(connectSourceId, node.id)];
        });
        commitToHistory("connect");

        if (connectMode === "chain") setConnectSourceId(node.id);
        return;
      }

      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
    },
    [connectMode, connectSourceId, commitToHistory]
  );

  // ─── Selection actions ───────────────────────────────────────────────────
  const clearSelection = useCallback(() => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: false })));
    setEdges((prev) => prev.map((e) => ({ ...e, selected: false })));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const selectAll = useCallback(() => {
    setNodes((prev) => prev.map((n) => ({ ...n, selected: true })));
  }, []);

  // ─── Clipboard actions ───────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (selectedNodeIds.size === 0) {
      message.warning("Aucun nœud sélectionné");
      return;
    }
    clipboardRef.current = copySelection(nodes, edges, selectedNodeIds);
    message.success(`${selectedNodeIds.size} élément(s) copié(s)`);
  }, [nodes, edges, selectedNodeIds]);

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current) {
      message.warning("Presse-papiers vide");
      return;
    }
    const { nodes: newNodes, edges: newEdges } = pasteClipboard(clipboardRef.current);

    // Deselect current, add new (selected)
    setNodes((prev) => [
      ...prev.map((n) => ({ ...n, selected: false })),
      ...newNodes,
    ]);
    setEdges((prev) => [...prev, ...newEdges]);
    commitToHistory("paste");
    message.success(`${newNodes.length} élément(s) collé(s)`);
  }, [commitToHistory]);

  const handleDuplicate = useCallback(() => {
    if (selectedNodeIds.size === 0) {
      message.warning("Aucun nœud sélectionné");
      return;
    }
    const { nodes: newNodes, edges: newEdges } = duplicateSelection(
      nodes,
      edges,
      selectedNodeIds
    );

    // Deselect current, add new (selected)
    setNodes((prev) => [
      ...prev.map((n) => ({ ...n, selected: false })),
      ...newNodes,
    ]);
    setEdges((prev) => [...prev, ...newEdges]);
    commitToHistory("duplicate");
    message.success(`${newNodes.length} élément(s) dupliqué(s)`);
  }, [nodes, edges, selectedNodeIds, commitToHistory]);

  const handleDeleteSelection = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = deleteSelection(
      nodes,
      edges,
      selectedNodeIds,
      selectedEdgeIds
    );
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    commitToHistory("delete");
  }, [nodes, edges, selectedNodeIds, selectedEdgeIds, commitToHistory]);

  // ─── Align & Distribute actions ──────────────────────────────────────────
  const handleAlign = useCallback((direction: AlignDirection) => {
    if (!canAlign(selectedNodeIds.size)) {
      message.warning("Sélectionnez au moins 2 nœuds pour aligner");
      return;
    }
    setNodes((prev) => alignNodes(prev, selectedNodeIds, direction, true, GRID_SIZE));
    commitToHistory(`align-${direction}`);
  }, [selectedNodeIds, commitToHistory]);

  const handleDistribute = useCallback((direction: DistributeDirection) => {
    if (!canDistribute(selectedNodeIds.size)) {
      message.warning("Sélectionnez au moins 3 nœuds pour distribuer");
      return;
    }
    setNodes((prev) => distributeNodes(prev, selectedNodeIds, direction, true, GRID_SIZE));
    commitToHistory(`distribute-${direction}`);
  }, [selectedNodeIds, commitToHistory]);

  // ─── Legacy actions ──────────────────────────────────────────────────────
  function syncFromSipoc() {
    if (!sipocRows?.length) {
      message.warning("Aucune ligne SIPOC à synchroniser.");
      return;
    }
    setNodes((prev) => buildFromSipoc(sipocRows, prev));
    commitToHistory("sync-sipoc");
    message.success("Nodes synchronisés depuis le SIPOC.");
  }

  function autoLayout() {
    setNodes(applyAutoLayout);
    commitToHistory("auto-layout");
    message.success("Auto-layout appliqué.");
  }

  function fitView() {
    try {
      rfRef.current?.fitView({ padding: FIT_VIEW_PADDING });
    } catch {
      // ignore
    }
  }

  function rebuildDefaultFlow() {
    if (!sipocRows?.length) return;
    const ids = sipocRows.map((r, i) => safeIdFromRow(r, `S${i + 1}`));
    setEdges(() => {
      const newEdges: Edge<OrthogonalEdgeData>[] = [];
      for (let i = 0; i < ids.length - 1; i++) {
        newEdges.push(createEdge(ids[i], ids[i + 1]));
      }
      return newEdges;
    });
    commitToHistory("rebuild-flow");
    message.success("Flux par défaut recréé.");
  }

  function exitConnectMode() {
    setConnectMode("off");
    setConnectSourceId(null);
  }

  function toggleConnectMode(mode: ConnectMode) {
    if (connectMode === mode) {
      exitConnectMode();
    } else {
      setConnectMode(mode);
      setConnectSourceId(null);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }

  // ─── Node updates ────────────────────────────────────────────────────────
  function updateSelectedNode(patch: Partial<ShapeNodeData>) {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNodeId) return n;
        return { ...n, data: { ...n.data, ...patch } };
      })
    );
    setDirty(true);
  }

  function updateSelectedNodeStyle(patch: Record<string, any>) {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNodeId) return n;
        const newDataStyle = { ...(n.data?.style || {}), ...patch };
        const result: Node<ShapeNodeData> = {
          ...n,
          data: { ...n.data, style: newDataStyle },
        };
        // Sync width/height to node.style and node.width/height for ReactFlow wrapper
        if ('width' in patch || 'height' in patch) {
          result.style = {
            ...(n.style || {}),
            ...(patch.width != null ? { width: patch.width } : {}),
            ...(patch.height != null ? { height: patch.height } : {}),
          };
          if (patch.width != null) (result as any).width = patch.width;
          if (patch.height != null) (result as any).height = patch.height;
        }
        return result;
      })
    );
    setDirty(true);
  }

  // ─── Edge updates ────────────────────────────────────────────────────────
  function updateSelectedEdge(patch: any) {
    if (!selectedEdgeId) return;
    setEdges((prev) =>
      prev.map((e) => {
        if (e.id !== selectedEdgeId) return e;
        const next: any = { ...e, ...patch };
        const c = next.data?.color || e.data?.color || "#f59ad5";
        const w = Number.isFinite(next.data?.width) ? next.data?.width : e.data?.width || 2;
        next.style = { ...(next.style || {}), stroke: c, strokeWidth: w };
        next.type = orthogonalEdges ? (next.type || "orthogonal") : "default";
        return next;
      })
    );
    setDirty(true);
  }

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    commitToHistory("delete-edge");
  }

  // ─── Legend ──────────────────────────────────────────────────────────────
  function resetLegend() {
    setLegend(defaultLegend());
  }

  function addLegendItem() {
    setLegend((prev) => [
      ...prev,
      { key: String(prev.length + 1), label: "New item", color: "#0ea5e9" },
    ]);
  }

  function updateLegendItem(index: number, patch: Partial<LegendItem>) {
    setLegend((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function deleteLegendItem(index: number) {
    setLegend((prev) => prev.filter((_, i) => i !== index));
  }

  // ─── Save ────────────────────────────────────────────────────────────────
  async function save() {
    try {
      setSaving(true);
      const stored = toStored(nodes, edges, legend);
      const payload = {
        entryNodeId: nodes[0]?.id || undefined,
        nodes: stored.nodes,
        edges: stored.edges,
        legend: stored.legend,
      };
      await saveLogigramme(processId, payload as any);
      message.success("Logigramme enregistré");
      setDirty(false);
      onSaved?.(payload);
    } catch (e: any) {
      message.error(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  // ─── Add node (DnD from palette) ────────────────────────────────────────
  const addNode = useCallback(
    (shape: string, label: string, position: { x: number; y: number }) => {
      const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const isDiamond = shape === "diamond" || shape === "diamond-x";
      const w = isDiamond ? 110 : 220;
      const h = isDiamond ? 110 : 64;
      const newNode: Node<ShapeNodeData> = {
        id,
        type: "shape",
        position: {
          x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
          y: Math.round(position.y / GRID_SIZE) * GRID_SIZE,
        },
        width: w,
        height: h,
        style: { width: w, height: h },
        data: {
          label,
          shape: shape as ShapeNodeData["shape"],
          style: { width: w, height: h },
          isLinkSource: false,
        },
      };
      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
      setDirty(true);
      commitToHistory("add-node");
    },
    [commitToHistory],
  );

  // ─── Export helpers ─────────────────────────────────────────────────────
  function exportJSON() {
    const stored = toStored(nodes, edges, legend);
    const json = JSON.stringify(stored, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logigramme-${processId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("JSON exporté");
  }

  function importJSON(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const loadedNodes = (data.nodes || []).map(nodeFromStored);
        const loadedEdges = (data.edges || [])
          .map(edgeFromStored)
          .filter((edge: Edge) => edge.source && edge.target);
        const loadedLegend = Array.isArray(data.legend) ? data.legend : legend;

        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setLegend(loadedLegend);
        setDirty(true);
        history.initialize(loadedNodes, loadedEdges);
        message.success("JSON importé");
      } catch (err) {
        message.error("Fichier JSON invalide");
      }
    };
    reader.readAsText(file);
  }

  // ─── Return ──────────────────────────────────────────────────────────────
  return {
    // State
    nodes,
    edges,
    legend,
    autoSync,
    saving,
    dirty,
    selectedNode,
    selectedEdge,
    selectedNodeIds,
    selectedCount,
    connectMode,
    connectSourceId,

    // Feature toggles
    guidesEnabled,
    setGuidesEnabled,
    orthogonalEdges,
    setOrthogonalEdges,

    // Guides
    guides,

    // History
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: handleUndo,
    redo: handleRedo,

    // Setters
    setAutoSync,
    setLegend,

    // ReactFlow callbacks
    onNodesChange,
    onNodeDragStop,
    onEdgesChange,
    onConnect,
    onInit,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    onSelectionChange,

    // Selection
    clearSelection,
    selectAll,

    // Clipboard
    copy: handleCopy,
    paste: handlePaste,
    duplicate: handleDuplicate,
    deleteSelection: handleDeleteSelection,

    // Align & Distribute
    align: handleAlign,
    distribute: handleDistribute,
    canAlign: () => canAlign(selectedCount),
    canDistribute: () => canDistribute(selectedCount),

    // Actions
    syncFromSipoc,
    autoLayout,
    fitView,
    rebuildDefaultFlow,
    toggleConnectMode,
    exitConnectMode,
    save,

    // Node actions
    updateSelectedNode,
    updateSelectedNodeStyle,

    // Edge actions
    updateSelectedEdge,
    deleteSelectedEdge,

    // Legend actions
    resetLegend,
    addLegendItem,
    updateLegendItem,
    deleteLegendItem,

    // DnD + Export/Import
    addNode,
    exportJSON,
    importJSON,
  };
}
