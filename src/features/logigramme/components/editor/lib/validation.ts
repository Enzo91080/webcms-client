import type { Node, Edge } from "reactflow";
import type { ShapeNodeData, OrthogonalEdgeData } from "../model/types";

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  message: string;
  elementId?: string;
  elementType?: "node" | "edge";
};

/**
 * Validate a BPMN diagram for common issues
 */
export function validateDiagram(
  nodes: Node<ShapeNodeData>[],
  edges: Edge<OrthogonalEdgeData>[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let issueIdx = 0;
  const nextId = () => `v-${++issueIdx}`;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const incomingEdges = new Map<string, Edge[]>();
  const outgoingEdges = new Map<string, Edge[]>();

  for (const e of edges) {
    if (!incomingEdges.has(e.target)) incomingEdges.set(e.target, []);
    incomingEdges.get(e.target)!.push(e);
    if (!outgoingEdges.has(e.source)) outgoingEdges.set(e.source, []);
    outgoingEdges.get(e.source)!.push(e);
  }

  for (const node of nodes) {
    const shape = node.data?.shape || "rectangle";
    const incoming = incomingEdges.get(node.id) || [];
    const outgoing = outgoingEdges.get(node.id) || [];

    // Start events should have no incoming edges
    if (shape.startsWith("event-start")) {
      if (incoming.length > 0) {
        issues.push({
          id: nextId(),
          severity: "error",
          message: `Événement de début "${node.data?.label}" ne devrait pas avoir de connexions entrantes`,
          elementId: node.id,
          elementType: "node",
        });
      }
      if (outgoing.length === 0) {
        issues.push({
          id: nextId(),
          severity: "warning",
          message: `Événement de début "${node.data?.label}" n'a pas de connexion sortante`,
          elementId: node.id,
          elementType: "node",
        });
      }
    }

    // End events should have no outgoing edges
    if (shape.startsWith("event-end")) {
      if (outgoing.length > 0) {
        issues.push({
          id: nextId(),
          severity: "error",
          message: `Événement de fin "${node.data?.label}" ne devrait pas avoir de connexions sortantes`,
          elementId: node.id,
          elementType: "node",
        });
      }
      if (incoming.length === 0) {
        issues.push({
          id: nextId(),
          severity: "warning",
          message: `Événement de fin "${node.data?.label}" n'a pas de connexion entrante`,
          elementId: node.id,
          elementType: "node",
        });
      }
    }

    // Gateways should have multiple outgoing edges (for exclusive/parallel/inclusive)
    if (shape.startsWith("gateway-")) {
      if (outgoing.length < 2) {
        issues.push({
          id: nextId(),
          severity: "warning",
          message: `Passerelle "${node.data?.label}" devrait avoir au moins 2 sorties`,
          elementId: node.id,
          elementType: "node",
        });
      }
    }

    // Orphan nodes (no connections at all, excluding containers)
    if (
      incoming.length === 0 &&
      outgoing.length === 0 &&
      !shape.startsWith("event-start") &&
      node.type !== "pool" &&
      node.type !== "lane" &&
      node.type !== "group" &&
      shape !== "group" &&
      shape !== "text-annotation"
    ) {
      issues.push({
        id: nextId(),
        severity: "info",
        message: `Nœud "${node.data?.label}" est orphelin (aucune connexion)`,
        elementId: node.id,
        elementType: "node",
      });
    }

    // Empty labels
    if (!node.data?.label || node.data.label.trim() === "") {
      if (shape !== "group" && shape !== "text-annotation") {
        issues.push({
          id: nextId(),
          severity: "warning",
          message: `Nœud sans libellé (ID: ${node.id})`,
          elementId: node.id,
          elementType: "node",
        });
      }
    }
  }

  // Orphan edges (source/target doesn't exist)
  for (const edge of edges) {
    if (!nodeMap.has(edge.source)) {
      issues.push({
        id: nextId(),
        severity: "error",
        message: `Lien "${edge.id}" a une source inexistante`,
        elementId: edge.id,
        elementType: "edge",
      });
    }
    if (!nodeMap.has(edge.target)) {
      issues.push({
        id: nextId(),
        severity: "error",
        message: `Lien "${edge.id}" a une cible inexistante`,
        elementId: edge.id,
        elementType: "edge",
      });
    }
  }

  // Check for at least one start event
  const hasStart = nodes.some((n) => n.data?.shape?.startsWith("event-start"));
  const hasEnd = nodes.some((n) => n.data?.shape?.startsWith("event-end"));

  if (nodes.length > 0 && !hasStart) {
    issues.push({
      id: nextId(),
      severity: "info",
      message: "Aucun événement de début trouvé dans le diagramme",
    });
  }
  if (nodes.length > 0 && !hasEnd) {
    issues.push({
      id: nextId(),
      severity: "info",
      message: "Aucun événement de fin trouvé dans le diagramme",
    });
  }

  return issues;
}
