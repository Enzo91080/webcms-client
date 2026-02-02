import { useMemo } from "react";
import ReactFlow, { Background, Controls, Edge, MarkerType, Node } from "reactflow";
import type { LogiNode, LogiEdge, SipocRow } from "../../types";
import OrthogonalEdge from "./OrthogonalEdge";
import ViewShapeNode from "./ViewShapeNode";

type StoredNode = LogiNode;
type StoredEdge = LogiEdge & { source?: string; target?: string };

function normalizeString(x: unknown) {
  return typeof x === "string" ? x.trim() : "";
}

/**
 * Resolve the best SIPOC key for a clicked node.
 * Priority: match by sipocRef/id -> SIPOC.ref, then SIPOC.numero, then designation.name.
 * Returns a stable key that the ProcessPage can use to highlight a row.
 */
function resolveSipocKey(node: Node, rows: SipocRow[]): string | null {
  const sipocRef = normalizeString(node.data?.sipocRef) || normalizeString(node.id);
  const label = normalizeString(node.data?.label);

  // 1) direct match on ref / numero
  for (const r of rows) {
    const ref = normalizeString(r.ref);
    const numero = normalizeString(r.numero);
    if (sipocRef && ref && sipocRef === ref) return ref;
    if (sipocRef && numero && sipocRef === numero) return ref || numero;
  }

  // 2) match by designation.name
  if (label) {
    for (const r of rows) {
      const ref = normalizeString(r.ref);
      const numero = normalizeString(r.numero);
      const name = normalizeString(r.designation?.name);
      if (name && name.toLowerCase() === label.toLowerCase()) return ref || numero || name;
    }
  }

  // 3) fallback: still return sipocRef or label if present
  return sipocRef || label || null;
}

export default function LogigrammeViewer({
  logigramme,
  sipocRows,
  onOpenSipocRow,
}: {
  logigramme: any;
  sipocRows?: SipocRow[];
  onOpenSipocRow?: (key: string) => void;
}) {
  const nodeTypes = useMemo(() => ({ shape: ViewShapeNode }), []);
  const edgeTypes = useMemo(() => ({ orthogonal: OrthogonalEdge }), []);

  const nodes: Node[] = useMemo(() => {
    const st: StoredNode[] = logigramme?.nodes || [];
    return st.map((n) => ({
      id: n.id,
      type: "shape",
      position: n.position || { x: 0, y: 0 },
      data: {
        label: n.label,
        shape: n.shape,
        interaction: n.interaction || null,
        sipocRef: n.sipocRef || null,
        style: (n as any).style || undefined,
      },
    }));
  }, [logigramme]);

  const edges: Edge[] = useMemo(() => {
    const st: StoredEdge[] = logigramme?.edges || [];
    return st
      .map((e) => {
        const source = String(e.from || e.source || "");
        const target = String(e.to || e.target || "");
        return {
          id: e.id,
          source,
          target,
          label: e.label || "",
          type: (e as any).kind || "orthogonal",
          markerEnd: { type: MarkerType.ArrowClosed },
          data: {
            color: (e as any).color,
            width: (e as any).width,
            badgeText: (e as any).badgeText,
            badgeColor: (e as any).badgeColor,
            badgeBg: (e as any).badgeBg,
          },
          style: { strokeWidth: (e as any).width || 2, stroke: (e as any).color || undefined },
        };
      })
      .filter((e) => e.source && e.target);
  }, [logigramme]);

  function handleNodeClick(_: any, node: Node) {
    // ✅ Requirement: click on a logigramme element opens SIPOC modal + highlights the related row
    const rows = Array.isArray(sipocRows) ? sipocRows : [];
    const key =
      rows.length ? resolveSipocKey(node, rows) : normalizeString(node.data?.sipocRef) || normalizeString(node.id);

    if (key && onOpenSipocRow) onOpenSipocRow(String(key));

    // optional tooltip fallback
    const interaction = node.data?.interaction;
    if (interaction?.action === "tooltip" && interaction.tooltip) {
      // eslint-disable-next-line no-alert
      alert(interaction.tooltip);
    }
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
        onNodeClick={handleNodeClick}
        fitView
        defaultEdgeOptions={{
          type: "orthogonal",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
        }}
      >
        <Background />
        <Controls  />
      </ReactFlow>
    </div>
    </div>
  );
}
