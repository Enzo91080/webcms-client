import { memo, useMemo } from "react";
import { Badge, Button, Collapse, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { Node, Edge } from "reactflow";
import type { ShapeNodeData, OrthogonalEdgeData } from "../model/types";
import { validateDiagram, type ValidationIssue, type ValidationSeverity } from "../lib/validation";

type ValidationPanelProps = {
  nodes: Node<ShapeNodeData>[];
  edges: Edge<OrthogonalEdgeData>[];
  onFocusElement?: (elementId: string, elementType: "node" | "edge") => void;
};

const SEVERITY_CONFIG: Record<ValidationSeverity, { color: string; icon: React.ReactNode; label: string }> = {
  error: { color: "#f5222d", icon: <ExclamationCircleOutlined />, label: "Erreur" },
  warning: { color: "#faad14", icon: <WarningOutlined />, label: "Avertissement" },
  info: { color: "#1890ff", icon: <InfoCircleOutlined />, label: "Info" },
};

function ValidationPanel({ nodes, edges, onFocusElement }: ValidationPanelProps) {
  const issues = useMemo(() => validateDiagram(nodes, edges), [nodes, edges]);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  if (issues.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px 10px" }}>
        <CheckCircleOutlined style={{ fontSize: 28, color: "#52c41a", marginBottom: 8 }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#52c41a" }}>
          Aucun problème détecté
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
          {nodes.length} nœuds, {edges.length} liens
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {errorCount > 0 && <Tag color="error">{errorCount} erreur{errorCount > 1 ? "s" : ""}</Tag>}
        {warnCount > 0 && <Tag color="warning">{warnCount} avertissement{warnCount > 1 ? "s" : ""}</Tag>}
        {infoCount > 0 && <Tag color="processing">{infoCount} info{infoCount > 1 ? "s" : ""}</Tag>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {issues.map((issue) => {
          const cfg = SEVERITY_CONFIG[issue.severity];
          return (
            <div
              key={issue.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #f0f0f0",
                cursor: issue.elementId ? "pointer" : "default",
                background: "#fff",
                fontSize: 12,
                lineHeight: 1.4,
              }}
              onClick={() => {
                if (issue.elementId && issue.elementType && onFocusElement) {
                  onFocusElement(issue.elementId, issue.elementType);
                }
              }}
            >
              <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>
                {cfg.icon}
              </span>
              <span>{issue.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ValidationPanel);
