import { memo, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  ReactFlowInstance,
  SelectionMode,
} from "reactflow";
import ShapeNode from "../../nodes/ShapeNode";
import OrthogonalEdge from "../../edges/OrthogonalEdge";
import AlignmentGuides, { type Guide } from "./AlignmentGuides";
import { defaultEdgeOptions, SNAP_GRID, MIN_ZOOM, MAX_ZOOM } from "../model/defaults";
import type { ShapeNodeData, OrthogonalEdgeData } from "../model/types";

type CanvasProps = {
  nodes: Node<ShapeNodeData>[];
  edges: Edge<OrthogonalEdgeData>[];
  guides: Guide[];
  orthogonalEdges: boolean;
  onNodesChange: (changes: NodeChange[]) => void;
  onNodeDragStop: () => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onInit: (instance: ReactFlowInstance) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick: () => void;
  onSelectionChange: (params: { nodes: Node[]; edges: Edge[] }) => void;
};

function Canvas({
  nodes,
  edges,
  guides,
  orthogonalEdges,
  onNodesChange,
  onNodeDragStop,
  onEdgesChange,
  onConnect,
  onInit,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onSelectionChange,
}: CanvasProps) {
  // Memoize node/edge types to prevent re-renders
  const nodeTypes = useMemo(() => ({ shape: ShapeNode }), []);
  const edgeTypes = useMemo(() => ({ orthogonal: OrthogonalEdge }), []);

  // Edge options based on toggle
  const edgeOptions = useMemo(() => {
    if (orthogonalEdges) {
      return defaultEdgeOptions;
    }
    return { ...defaultEdgeOptions, type: "default" };
  }, [orthogonalEdges]);

  return (
    <div style={{ height: 680, position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        fitView
        snapToGrid
        snapGrid={SNAP_GRID}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        defaultEdgeOptions={edgeOptions}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        selectNodesOnDrag
        panOnScroll
        zoomOnScroll
        deleteKeyCode={null} // We handle delete manually
        multiSelectionKeyCode="Shift"
      >
        <Background gap={10} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Alignment guides overlay */}
      <AlignmentGuides guides={guides} />
    </div>
  );
}

export default memo(Canvas);
