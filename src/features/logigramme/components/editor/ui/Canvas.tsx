import { memo, useCallback, useMemo, useRef } from "react";
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
import PoolNode from "../../nodes/PoolNode";
import LaneNode from "../../nodes/LaneNode";
import GroupNode from "../../nodes/GroupNode";
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
  onDropNode?: (shape: string, label: string, position: { x: number; y: number }) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: Node) => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
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
  onDropNode,
  onNodeContextMenu,
  onPaneContextMenu,
}: CanvasProps) {
  const nodeTypes = useMemo(() => ({
    shape: ShapeNode,
    pool: PoolNode,
    lane: LaneNode,
    group: GroupNode,
  }), []);
  const edgeTypes = useMemo(() => ({ orthogonal: OrthogonalEdge }), []);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const rfInstance = useRef<ReactFlowInstance | null>(null);

  const edgeOptions = useMemo(() => {
    if (orthogonalEdges) {
      return defaultEdgeOptions;
    }
    return { ...defaultEdgeOptions, type: "default" };
  }, [orthogonalEdges]);

  const handleInit = useCallback(
    (instance: ReactFlowInstance) => {
      rfInstance.current = instance;
      onInit(instance);
    },
    [onInit],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const shape = e.dataTransfer.getData("application/logigramme-shape");
      const label = e.dataTransfer.getData("application/logigramme-label");
      if (!shape || !onDropNode || !rfInstance.current || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.current.project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      onDropNode(shape, label, position);
    },
    [onDropNode],
  );

  return (
    <div
      ref={reactFlowWrapper}
      style={{ height: 680, position: "relative" }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={handleInit}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
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
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        edgesFocusable
        edgesUpdatable
      >
        <Background gap={10} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <AlignmentGuides guides={guides} />
    </div>
  );
}

export default memo(Canvas);
