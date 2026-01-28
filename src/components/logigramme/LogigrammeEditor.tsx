import {
  Badge,
  Button,
  Card,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Switch,
  Tabs,
  Tooltip,
  Typography
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MarkerType,
  MiniMap,
  Node,
  NodeChange,
  ReactFlowInstance,
} from "reactflow";
import { saveLogigramme } from "../../lib/api";
import OrthogonalEdge from "./OrthogonalEdge";
import ShapeNode, { Shape } from "./ShapeNode";

type SipocRow = {
  ref?: string;
  designation?: { name?: string; url?: string };
};

type LegendItem = {
  key: string;
  label: string;
  color?: string;
  bg?: string;
};

type StoredNode = {
  id: string;
  sipocRef?: string;
  shape?: Shape;
  label?: string;
  position?: { x: number; y: number };
  style?: any;
  interaction?: any;
};

type StoredEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind?: "orthogonal" | "step" | "smooth";
  color?: string;
  width?: number;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
};

function safeIdFromRow(r: SipocRow, fallback: string) {
  const id = String(r?.ref || "").trim();
  return id || fallback;
}

function defaultLegend(): LegendItem[] {
  return [
    { key: "1", label: "Manager l’entreprise", color: "#64748b" },
    { key: "2", label: "Vendre", color: "#f59e0b" },
    { key: "3", label: "Planifier", color: "#e879f9" },
    { key: "4", label: "Manager le Programme", color: "#0ea5e9" },
    { key: "5", label: "Réaliser", color: "#475569" },
    { key: "6", label: "Valider", color: "#84cc16" },
  ];
}

function gridLayout(ids: string[], { startX = 90, startY = 70, colWidth = 320, rowGap = 120 } = {}) {
  const cols = Math.max(3, Math.min(6, ids.length));
  const pos = new Map<string, { x: number; y: number }>();
  ids.forEach((id, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    pos.set(id, { x: startX + col * colWidth, y: startY + row * rowGap });
  });
  return pos;
}

function buildFromSipoc(rows: SipocRow[], prevNodes: Node[] = []) {
  const prevById = new Map(prevNodes.map((n) => [n.id, n]));
  const ids = rows.map((r, i) => safeIdFromRow(r, `S${i + 1}`));
  const layout = gridLayout(ids);

  const nodes: Node[] = ids.map((id, i) => {
    const row = rows[i];
    const prev = prevById.get(id);
    const label = String(row?.designation?.name || id);
    const baseData: any = {
      label,
      shape: (prev?.data as any)?.shape || "rectangle",
      sipocRef: id,
      style: (prev?.data as any)?.style || undefined,
      interaction: (prev?.data as any)?.interaction || null,
      isLinkSource: (prev?.data as any)?.isLinkSource || false,
    };
    const position = prev?.position || layout.get(id) || { x: 0, y: 0 };
    return { id, type: "shape", position, data: baseData };
  });

  return { nodes };
}

function toStored(nodes: Node[], edges: Edge[], legend: LegendItem[]) {
  const storedNodes: StoredNode[] = nodes.map((n) => ({
    id: n.id,
    sipocRef: (n.data as any)?.sipocRef || n.id,
    shape: ((n.data as any)?.shape || "rectangle") as Shape,
    label: String((n.data as any)?.label || n.id),
    position: n.position,
    style: (n.data as any)?.style || undefined,
    interaction: (n.data as any)?.interaction || null,
  }));

  const storedEdges: StoredEdge[] = edges.map((e, i) => ({
    id: e.id || `e${i + 1}`,
    from: String(e.source),
    to: String(e.target),
    label: String((e as any).label || ""),
    kind: String((e as any).type || "orthogonal") as any,
    color: (e as any).data?.color,
    width: (e as any).data?.width,
    badgeText: (e as any).data?.badgeText,
    badgeColor: (e as any).data?.badgeColor,
    badgeBg: (e as any).data?.badgeBg,
  }));

  return { nodes: storedNodes, edges: storedEdges, legend };
}

function edgeFromStored(se: any, i: number): Edge {
  const kind = (se.kind || se.type || "orthogonal") as any;
  const color = se.color || "#f59ad5";
  const width = Number.isFinite(se.width) ? se.width : 2;
  return {
    id: se.id || `e${i + 1}`,
    source: se.from || se.source,
    target: se.to || se.target,
    type: kind,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: color, strokeWidth: width },
    data: {
      color,
      width,
      badgeText: se.badgeText,
      badgeColor: se.badgeColor,
      badgeBg: se.badgeBg,
    },
    label: se.label || "",
  } as any;
}

function uniqueEdgeId(source: string, target: string) {
  return `e-${source}-${target}-${Date.now()}`;
}

function hasEdge(edges: Edge[], source: string, target: string) {
  return edges.some((e) => e.source === source && e.target === target);
}

export default function LogigrammeEditor({
  processId,
  sipocRows,
  initial,
  onSaved,
}: {
  processId: string;
  sipocRows: SipocRow[];
  initial: any | undefined;
  onSaved?: (logi: any) => void;
}) {
  const nodeTypes = useMemo(() => ({ shape: ShapeNode }), []);
  const edgeTypes = useMemo(() => ({ orthogonal: OrthogonalEdge }), []);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [legend, setLegend] = useState<LegendItem[]>(defaultLegend());

  const [autoSync, setAutoSync] = useState(true);
  const [ready, setReady] = useState(false);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const [connectMode, setConnectMode] = useState<"off" | "fanout" | "chain">("off");
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const rfRef = useRef<ReactFlowInstance | null>(null);

  // Load initial
  useEffect(() => {
    const stNodes: StoredNode[] = initial?.nodes || [];
    const stEdges: any[] = initial?.edges || [];
    const stLegend: LegendItem[] = Array.isArray(initial?.legend) ? initial.legend : defaultLegend();

    const n: Node[] = stNodes.map((sn) => ({
      id: sn.id,
      type: "shape",
      position: sn.position || { x: 0, y: 0 },
      data: {
        label: sn.label || sn.id,
        shape: sn.shape || "rectangle",
        sipocRef: sn.sipocRef || sn.id,
        style: sn.style || undefined,
        interaction: sn.interaction || null,
        isLinkSource: false,
      },
    }));

    const e: Edge[] = stEdges.map(edgeFromStored).filter((x: any) => x.source && x.target);

    setNodes(n);
    setEdges(e);
    setLegend(stLegend);
    setReady(true);
  }, [processId, initial]);

  // Highlight connect source
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...(n.data as any), isLinkSource: connectSourceId ? n.id === connectSourceId : false },
      }))
    );
  }, [connectSourceId]);

  // Auto-sync SIPOC -> nodes
  useEffect(() => {
    if (!ready) return;
    if (!autoSync) return;
    if (!sipocRows?.length) return;
    setNodes((prev) => buildFromSipoc(sipocRows, prev).nodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(sipocRows), autoSync, ready]);

  function syncFromSipoc() {
    if (!sipocRows?.length) {
      message.warning("Aucune ligne SIPOC à synchroniser.");
      return;
    }
    setNodes((prev) => buildFromSipoc(sipocRows, prev).nodes);
    message.success("Nodes synchronisés depuis le SIPOC (positions conservées).");
  }

  function autoLayout() {
    const ids = nodes.map((n) => n.id);
    const layout = gridLayout(ids);
    setNodes((prev) => prev.map((n) => ({ ...n, position: layout.get(n.id) || n.position })));
    message.success("Auto-layout appliqué.");
  }

  function fitView() {
    try {
      rfRef.current?.fitView({ padding: 0.18 });
    } catch { }
  }

  function rebuildDefaultFlow() {
    if (!sipocRows?.length) return;
    const ids = sipocRows.map((r, i) => safeIdFromRow(r, `S${i + 1}`));
    setEdges(() => {
      const newEdges: Edge[] = [];
      for (let i = 0; i < ids.length - 1; i++) {
        newEdges.push({
          id: uniqueEdgeId(ids[i], ids[i + 1]),
          source: ids[i],
          target: ids[i + 1],
          type: "orthogonal",
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { color: "#f59ad5", width: 2 },
          style: { stroke: "#f59ad5", strokeWidth: 2 },
        } as any);
      }
      return newEdges;
    });
    message.success("Flux par défaut recréé (enchaînement SIPOC).");
  }

  const onNodesChange = (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds));
  const onConnect = (c: Connection) =>
    setEdges((eds) =>
      addEdge(
        {
          ...c,
          type: "orthogonal",
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { color: "#f59ad5", width: 2 },
          style: { stroke: "#f59ad5", strokeWidth: 2 },
        } as any,
        eds
      )
    );

  function onNodeClick(n: Node) {
    if (connectMode !== "off") {
      if (!connectSourceId) {
        setConnectSourceId(n.id);
        setSelectedNode(n);
        setSelectedEdge(null);
        return;
      }
      if (connectSourceId === n.id) {
        setConnectSourceId(null);
        return;
      }

      setEdges((prev) => {
        if (hasEdge(prev, connectSourceId, n.id)) return prev;
        const edge: Edge = {
          id: uniqueEdgeId(connectSourceId, n.id),
          source: connectSourceId,
          target: n.id,
          type: "orthogonal",
          markerEnd: { type: MarkerType.ArrowClosed },
          data: { color: "#f59ad5", width: 2 },
          style: { stroke: "#f59ad5", strokeWidth: 2 },
        } as any;
        return [...prev, edge];
      });

      if (connectMode === "chain") setConnectSourceId(n.id);
      return;
    }

    setSelectedNode(n);
    setSelectedEdge(null);
  }

  function updateSelectedNode(patch: any) {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNode.id) return n;
        return { ...n, data: { ...(n.data as any), ...patch } };
      })
    );
  }

  function updateSelectedNodeStyle(patch: any) {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNode.id) return n;
        const data = { ...(n.data as any), style: { ...((n.data as any)?.style || {}), ...patch } };
        return { ...n, data };
      })
    );
  }

  function updateSelectedEdge(patch: any) {
    if (!selectedEdge) return;
    setEdges((prev) =>
      prev.map((e) => {
        if (e.id !== selectedEdge.id) return e;
        const next: any = { ...e, ...patch };
        const c = (next.data?.color || (e as any).data?.color || "#f59ad5") as string;
        const w = Number.isFinite(next.data?.width) ? next.data?.width : (e as any).data?.width || 2;
        next.style = { ...(next.style || {}), stroke: c, strokeWidth: w };
        next.type = next.type || "orthogonal";
        next.markerEnd = next.markerEnd || { type: MarkerType.ArrowClosed };
        return next;
      })
    );
  }

  async function save() {
    try {
      setSaving(true);
      const stored = toStored(nodes, edges, legend);
      const payload = {
        entryNodeId: nodes[0]?.id || null,
        nodes: stored.nodes,
        edges: stored.edges,
        legend: stored.legend,
      };
      await saveLogigramme(processId, payload);
      message.success("Logigramme enregistré");
      onSaved?.(payload);
    } catch (e: any) {
      message.error(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  function exitConnectMode() {
    setConnectMode("off");
    setConnectSourceId(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") exitConnectMode();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectionKind = selectedNode ? "node" : selectedEdge ? "edge" : "none";
  const selectionId = selectedNode?.id || selectedEdge?.id || "—";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 12 }}>
      {/* Canvas */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
        }}
      >
        {/* Topbar */}
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid #e5e7eb",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#0ea5e9" }} />
              <div>
                <Typography.Text strong style={{ fontSize: 14 }}>
                  Logigramme
                </Typography.Text>
                <div style={{ fontSize: 12, opacity: 0.65 }}>
                  Orthogonal • Pastilles • 1→N / Chaîne • Auto-sync SIPOC
                </div>
              </div>
            </div>

            <Space align="center" wrap>
              <Space size={8} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
                <Switch checked={autoSync} onChange={setAutoSync} />
                <span style={{ fontSize: 12, opacity: 0.8 }}>Auto-sync</span>
              </Space>

              <Button onClick={syncFromSipoc}>Sync SIPOC</Button>
              <Button onClick={rebuildDefaultFlow}>Flux</Button>
              <Button onClick={autoLayout}>Layout</Button>
              <Button onClick={fitView}>Fit</Button>

              <Divider type="vertical" />

              <Tooltip title="Clique source puis plusieurs cibles (ESC pour quitter)">
                <Button
                  type={connectMode === "fanout" ? "primary" : "default"}
                  onClick={() => {
                    setConnectMode((m) => (m === "fanout" ? "off" : "fanout"));
                    setConnectSourceId(null);
                    setSelectedNode(null);
                    setSelectedEdge(null);
                  }}
                >
                  1→N
                </Button>
              </Tooltip>

              <Tooltip title="Clique source puis cible, la cible devient la nouvelle source (ESC pour quitter)">
                <Button
                  type={connectMode === "chain" ? "primary" : "default"}
                  onClick={() => {
                    setConnectMode((m) => (m === "chain" ? "off" : "chain"));
                    setConnectSourceId(null);
                    setSelectedNode(null);
                    setSelectedEdge(null);
                  }}
                >
                  Chaîne
                </Button>
              </Tooltip>

              {connectMode !== "off" ? (
                <Button danger onClick={exitConnectMode}>
                  Quitter
                </Button>
              ) : null}

              <Button type="primary" onClick={save} loading={saving}>
                Enregistrer
              </Button>
            </Space>
          </div>

          {/* Connect mode banner */}
          {connectMode !== "off" ? (
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                borderRadius: 12,
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
                <b>Connecteur actif :</b> {connectMode === "fanout" ? "1 → N" : "Chaîne"} — Source :{" "}
                <b>{connectSourceId || "—"}</b>
              </div>
              <div style={{ opacity: 0.7 }}>ESC pour quitter</div>
            </div>
          ) : null}
        </div>

        {/* ReactFlow area */}
        <div style={{ height: 680 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(inst) => (rfRef.current = inst)}
            onNodeClick={(_, n) => onNodeClick(n)}
            onEdgeClick={(_, e) => {
              setSelectedEdge(e);
              setSelectedNode(null);
            }}
            onPaneClick={() => {
              setSelectedNode(null);
              setSelectedEdge(null);
              if (connectMode !== "off") setConnectSourceId(null);
            }}
            fitView
            defaultEdgeOptions={{
              type: "orthogonal",
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { stroke: "#f59ad5", strokeWidth: 2 },
              data: { color: "#f59ad5", width: 2 },
            }}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Inspector */}
      <Card
        size="small"
        style={{
          borderRadius: 14,
          boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
          border: "1px solid #e5e7eb",
        }}
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div>
              <Typography.Text strong>Inspector</Typography.Text>
              <div style={{ fontSize: 12, opacity: 0.65 }}>Sélection + styles + légende</div>
            </div>

            <Badge
              color={selectionKind === "node" ? "#0ea5e9" : selectionKind === "edge" ? "#f59e0b" : "#94a3b8"}
              text={selectionKind === "node" ? "Node" : selectionKind === "edge" ? "Edge" : "None"}
            />
          </div>
        }
      >
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 10,
            background: "#f8fafc",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>ID</div>
              <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectionId}
              </div>
            </div>

            {selectedEdge ? (
              <Button danger size="small" onClick={() => setEdges((prev) => prev.filter((x) => x.id !== selectedEdge.id))}>
                Supprimer
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs
          defaultActiveKey="props"
          items={[
            {
              key: "props",
              label: "Propriétés",
              children: (
                <>
                  {selectedNode ? (
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
                                  value={String((selectedNode.data as any)?.label || "")}
                                  onChange={(e) => updateSelectedNode({ label: e.target.value })}
                                />
                              </Form.Item>

                              <Form.Item label="Forme" style={{ marginBottom: 0 }}>
                                <Select
                                  value={String((selectedNode.data as any)?.shape || "rectangle")}
                                  onChange={(v) => updateSelectedNode({ shape: v })}
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
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <Form.Item label="Largeur" style={{ marginBottom: 0 }}>
                                  <InputNumber
                                    style={{ width: "100%" }}
                                    min={120}
                                    max={520}
                                    value={Number((selectedNode.data as any)?.style?.width || 220)}
                                    onChange={(v) => updateSelectedNodeStyle({ width: v })}
                                  />
                                </Form.Item>

                                <Form.Item label="Hauteur" style={{ marginBottom: 0 }}>
                                  <InputNumber
                                    style={{ width: "100%" }}
                                    min={50}
                                    max={360}
                                    value={Number((selectedNode.data as any)?.style?.height || 80)}
                                    onChange={(v) => updateSelectedNodeStyle({ height: v })}
                                  />
                                </Form.Item>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                                <Form.Item label="Fond" style={{ marginBottom: 0 }}>
                                  <Input
                                    type="color"
                                    value={String((selectedNode.data as any)?.style?.fill || "#ffffff")}
                                    onChange={(e) => updateSelectedNodeStyle({ fill: e.target.value })}
                                  />
                                </Form.Item>

                                <Form.Item label="Contour" style={{ marginBottom: 0 }}>
                                  <Input
                                    type="color"
                                    value={String((selectedNode.data as any)?.style?.stroke || "#cbd5e1")}
                                    onChange={(e) => updateSelectedNodeStyle({ stroke: e.target.value })}
                                  />
                                </Form.Item>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                                <Form.Item label="Texte" style={{ marginBottom: 0 }}>
                                  <Input
                                    type="color"
                                    value={String((selectedNode.data as any)?.style?.text || "#0f172a")}
                                    onChange={(e) => updateSelectedNodeStyle({ text: e.target.value })}
                                  />
                                </Form.Item>

                                <Form.Item label="Font" style={{ marginBottom: 0 }}>
                                  <InputNumber
                                    style={{ width: "100%" }}
                                    min={10}
                                    max={22}
                                    value={Number((selectedNode.data as any)?.style?.fontSize || 13)}
                                    onChange={(v) => updateSelectedNodeStyle({ fontSize: v })}
                                  />
                                </Form.Item>
                              </div>
                            </Form>
                          ),
                        },
                      ]}
                    />
                  ) : selectedEdge ? (
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
                                  value={String((selectedEdge.type as any) || "orthogonal")}
                                  onChange={(v) => updateSelectedEdge({ type: v })}
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
                                  onChange={(e) => updateSelectedEdge({ label: e.target.value })}
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
                                  value={String((selectedEdge as any).data?.color || "#f59ad5")}
                                  onChange={(e) =>
                                    updateSelectedEdge({ data: { ...(selectedEdge as any).data, color: e.target.value } })
                                  }
                                />
                              </Form.Item>

                              <Form.Item label="Épaisseur" style={{ marginBottom: 0 }}>
                                <InputNumber
                                  style={{ width: "100%" }}
                                  min={1}
                                  max={8}
                                  value={Number((selectedEdge as any).data?.width || 2)}
                                  onChange={(v) => updateSelectedEdge({ data: { ...(selectedEdge as any).data, width: v } })}
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
                                  value={String((selectedEdge as any).data?.badgeText || "")}
                                  onChange={(e) =>
                                    updateSelectedEdge({ data: { ...(selectedEdge as any).data, badgeText: e.target.value } })
                                  }
                                />
                              </Form.Item>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <Form.Item label="Texte" style={{ marginBottom: 0 }}>
                                  <Input
                                    type="color"
                                    value={String((selectedEdge as any).data?.badgeColor || "#0ea5e9")}
                                    onChange={(e) =>
                                      updateSelectedEdge({
                                        data: { ...(selectedEdge as any).data, badgeColor: e.target.value },
                                      })
                                    }
                                  />
                                </Form.Item>
                                <Form.Item label="Fond" style={{ marginBottom: 0 }}>
                                  <Input
                                    type="color"
                                    value={String((selectedEdge as any).data?.badgeBg || "#ffffff")}
                                    onChange={(e) =>
                                      updateSelectedEdge({ data: { ...(selectedEdge as any).data, badgeBg: e.target.value } })
                                    }
                                  />
                                </Form.Item>
                              </div>
                            </Form>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <div style={{ color: "#64748b" }}>
                      Clique un nœud ou un lien pour ouvrir l’inspector.
                    </div>
                  )}
                </>
              ),
            },
            {
              key: "legend",
              label: "Légende",
              children: (
                <>
                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
                    Cette légende est sauvegardée dans le logigramme (et réutilisée côté Preview).
                  </div>

                  <Space wrap style={{ marginBottom: 10 }}>
                    <Button onClick={() => setLegend(defaultLegend())}>Preset 1..6</Button>
                    <Button
                      type="primary"
                      onClick={() =>
                        setLegend((prev) => [...prev, { key: String(prev.length + 1), label: "New item", color: "#0ea5e9" }])
                      }
                    >
                      Ajouter
                    </Button>
                  </Space>

                  <div style={{ display: "grid", gap: 10 }}>
                    {legend.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          padding: 10,
                          background: "#fff",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <Space size={10}>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 99,
                                background: it.color || "#0ea5e9",
                                boxShadow: "0 0 0 4px rgba(2,6,23,0.04)",
                                display: "inline-block",
                              }}
                            />
                            <Typography.Text strong style={{ fontSize: 13 }}>
                              {it.key} — {it.label}
                            </Typography.Text>
                          </Space>

                          <Button danger size="small" onClick={() => setLegend((prev) => prev.filter((_, i) => i !== idx))}>
                            Suppr.
                          </Button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, marginTop: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Key</div>
                            <Input
                              value={it.key}
                              onChange={(e) =>
                                setLegend((prev) => prev.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x)))
                              }
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Label</div>
                            <Input
                              value={it.label}
                              onChange={(e) =>
                                setLegend((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                              }
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Color</div>
                            <Input
                              type="color"
                              value={it.color || "#0ea5e9"}
                              onChange={(e) =>
                                setLegend((prev) => prev.map((x, i) => (i === idx ? { ...x, color: e.target.value } : x)))
                              }
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>Background (opt)</div>
                            <Input
                              type="color"
                              value={it.bg || "#ffffff"}
                              onChange={(e) =>
                                setLegend((prev) => prev.map((x, i) => (i === idx ? { ...x, bg: e.target.value } : x)))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ),
            },
            {
              key: "help",
              label: "Aide",
              children: (
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
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
