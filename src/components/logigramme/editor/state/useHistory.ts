import { useCallback, useRef } from "react";
import type { Node, Edge } from "reactflow";

/**
 * History snapshot
 */
type Snapshot<N, E> = {
  nodes: N[];
  edges: E[];
  reason?: string;
};

/**
 * History state
 */
type HistoryState<N, E> = {
  past: Snapshot<N, E>[];
  present: Snapshot<N, E>;
  future: Snapshot<N, E>[];
};

const MAX_HISTORY = 50;

/**
 * Deep clone for snapshots (simple JSON approach for performance)
 */
function cloneSnapshot<N, E>(snapshot: Snapshot<N, E>): Snapshot<N, E> {
  return JSON.parse(JSON.stringify(snapshot));
}

/**
 * Hook for undo/redo history management
 *
 * Strategy:
 * - commit() is called explicitly after significant actions (not during drag)
 * - onNodeDragStop triggers commit
 * - add/delete/connect/align actions trigger commit
 */
export function useHistory<N = Node, E = Edge>(
  initialNodes: N[] = [],
  initialEdges: E[] = []
) {
  const historyRef = useRef<HistoryState<N, E>>({
    past: [],
    present: { nodes: initialNodes, edges: initialEdges },
    future: [],
  });

  // Track if we need to initialize from external state
  const initializedRef = useRef(false);

  /**
   * Initialize history with current state (call once after loading)
   */
  const initialize = useCallback((nodes: N[], edges: E[]) => {
    historyRef.current = {
      past: [],
      present: { nodes: [...nodes], edges: [...edges] },
      future: [],
    };
    initializedRef.current = true;
  }, []);

  /**
   * Commit current state to history
   * Call this after significant changes (not during drag)
   */
  const commit = useCallback((nodes: N[], edges: E[], reason?: string) => {
    const history = historyRef.current;
    const newSnapshot = cloneSnapshot({ nodes, edges, reason });

    // Don't commit if nothing changed
    const presentStr = JSON.stringify({
      nodes: history.present.nodes,
      edges: history.present.edges
    });
    const newStr = JSON.stringify({ nodes, edges });
    if (presentStr === newStr) return;

    // Push current present to past
    const newPast = [...history.past, cloneSnapshot(history.present)];

    // Limit history size
    if (newPast.length > MAX_HISTORY) {
      newPast.shift();
    }

    historyRef.current = {
      past: newPast,
      present: newSnapshot,
      future: [], // Clear future on new commit
    };
  }, []);

  /**
   * Undo - restore previous state
   * Returns the restored state or null if can't undo
   */
  const undo = useCallback((): Snapshot<N, E> | null => {
    const history = historyRef.current;
    if (history.past.length === 0) return null;

    const newPast = [...history.past];
    const previous = newPast.pop()!;

    historyRef.current = {
      past: newPast,
      present: previous,
      future: [cloneSnapshot(history.present), ...history.future],
    };

    return cloneSnapshot(previous);
  }, []);

  /**
   * Redo - restore next state
   * Returns the restored state or null if can't redo
   */
  const redo = useCallback((): Snapshot<N, E> | null => {
    const history = historyRef.current;
    if (history.future.length === 0) return null;

    const newFuture = [...history.future];
    const next = newFuture.shift()!;

    historyRef.current = {
      past: [...history.past, cloneSnapshot(history.present)],
      present: next,
      future: newFuture,
    };

    return cloneSnapshot(next);
  }, []);

  /**
   * Check if can undo
   */
  const canUndo = useCallback(() => {
    return historyRef.current.past.length > 0;
  }, []);

  /**
   * Check if can redo
   */
  const canRedo = useCallback(() => {
    return historyRef.current.future.length > 0;
  }, []);

  /**
   * Get current history info (for debugging)
   */
  const getHistoryInfo = useCallback(() => {
    const h = historyRef.current;
    return {
      pastCount: h.past.length,
      futureCount: h.future.length,
      lastReason: h.present.reason,
    };
  }, []);

  return {
    initialize,
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
    getHistoryInfo,
  };
}
