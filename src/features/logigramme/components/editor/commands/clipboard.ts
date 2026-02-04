import type { Node, Edge } from "reactflow";

/**
 * Clipboard content for copy/paste
 */
export type ClipboardContent<N = Node, E = Edge> = {
  nodes: N[];
  edges: E[];
  timestamp: number;
};

/**
 * Generate a new unique ID
 */
function generateId(prefix: string = "node"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Copy selected nodes and their internal edges
 *
 * @param nodes All nodes
 * @param edges All edges
 * @param selectedNodeIds IDs of selected nodes
 * @returns Clipboard content with selected nodes and internal edges
 */
export function copySelection<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  selectedNodeIds: Set<string>
): ClipboardContent<N, E> {
  // Get selected nodes
  const selectedNodes = nodes.filter((n) => selectedNodeIds.has(n.id));

  // Get edges where both source and target are in selection
  const internalEdges = edges.filter(
    (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
  );

  return {
    nodes: JSON.parse(JSON.stringify(selectedNodes)),
    edges: JSON.parse(JSON.stringify(internalEdges)),
    timestamp: Date.now(),
  };
}

/**
 * Paste clipboard content with offset and new IDs
 *
 * @param clipboard Clipboard content
 * @param offset Position offset for pasted nodes
 * @returns New nodes and edges with unique IDs
 */
export function pasteClipboard<N extends Node, E extends Edge>(
  clipboard: ClipboardContent<N, E>,
  offset: { x: number; y: number } = { x: 20, y: 20 }
): { nodes: N[]; edges: E[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();

  // Create new nodes with new IDs and offset positions
  const newNodes = clipboard.nodes.map((node) => {
    const newId = generateId("n");
    idMap.set(node.id, newId);

    return {
      ...node,
      id: newId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      selected: true, // Select pasted nodes
      data: {
        ...node.data,
        sipocRef: undefined, // Clear SIPOC ref for pasted nodes
      },
    } as N;
  });

  // Create new edges with remapped IDs
  const newEdges = clipboard.edges.map((edge) => {
    const newSource = idMap.get(edge.source);
    const newTarget = idMap.get(edge.target);

    if (!newSource || !newTarget) {
      // Skip edges that reference nodes not in clipboard
      return null;
    }

    return {
      ...edge,
      id: generateId("e"),
      source: newSource,
      target: newTarget,
      selected: false,
    } as E;
  }).filter((e): e is E => e !== null);

  return { nodes: newNodes, edges: newEdges, idMap };
}

/**
 * Duplicate selected nodes in place (with offset)
 *
 * @param nodes All nodes
 * @param edges All edges
 * @param selectedNodeIds IDs of selected nodes
 * @param offset Position offset
 * @returns New nodes and edges to add
 */
export function duplicateSelection<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  selectedNodeIds: Set<string>,
  offset: { x: number; y: number } = { x: 20, y: 20 }
): { nodes: N[]; edges: E[] } {
  const clipboard = copySelection(nodes, edges, selectedNodeIds);
  const { nodes: newNodes, edges: newEdges } = pasteClipboard(clipboard, offset);
  return { nodes: newNodes, edges: newEdges };
}

/**
 * Delete selected nodes and connected edges
 *
 * @param nodes All nodes
 * @param edges All edges
 * @param selectedNodeIds IDs of nodes to delete
 * @param selectedEdgeIds IDs of edges to delete
 * @returns Filtered nodes and edges
 */
export function deleteSelection<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  selectedNodeIds: Set<string>,
  selectedEdgeIds: Set<string>
): { nodes: N[]; edges: E[] } {
  // Remove selected nodes
  const remainingNodes = nodes.filter((n) => !selectedNodeIds.has(n.id));

  // Remove selected edges AND edges connected to deleted nodes
  const remainingEdges = edges.filter(
    (e) =>
      !selectedEdgeIds.has(e.id) &&
      !selectedNodeIds.has(e.source) &&
      !selectedNodeIds.has(e.target)
  );

  return { nodes: remainingNodes, edges: remainingEdges };
}
