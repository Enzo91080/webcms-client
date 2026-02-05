import { Collapse, Input, Typography } from "antd";
import type { StakeholderLinkFields } from "../../../shared/types";

/**
 * Données UI pour la section "Détails par processus" côté Stakeholder.
 */
export type ProcessLinkData = {
  processId: string;
  code: string;
  name: string;
} & StakeholderLinkFields;

type Props = {
  links: ProcessLinkData[];
  onUpdateField: (
    processId: string,
    field: keyof StakeholderLinkFields,
    value: string | null
  ) => void;
};

/**
 * Éditeur des détails par processus (besoins, attentes, SWOT, etc.)
 * Utilisé dans AdminListStakeholderPage pour éditer les liens stakeholder -> process.
 */
export function ProcessLinksEditor({ links, onUpdateField }: Props) {
  if (links.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
        Détails par processus
      </Typography.Text>

      <Collapse
        accordion
        items={links.map((link) => ({
          key: link.processId,
          label: `${link.code} — ${link.name}`,
          children: (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Besoins
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.needs ?? ""}
                  onChange={(e) => onUpdateField(link.processId, "needs", e.target.value)}
                  placeholder="Besoins pour ce processus..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Attentes
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.expectations ?? ""}
                  onChange={(e) => onUpdateField(link.processId, "expectations", e.target.value)}
                  placeholder="Attentes..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Éléments d'évaluation
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.evaluationCriteria ?? ""}
                  onChange={(e) =>
                    onUpdateField(link.processId, "evaluationCriteria", e.target.value)
                  }
                  placeholder="Critères d'évaluation..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Exigences
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.requirements ?? ""}
                  onChange={(e) => onUpdateField(link.processId, "requirements", e.target.value)}
                  placeholder="Exigences..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Forces
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.strengths ?? ""}
                  onChange={(e) => onUpdateField(link.processId, "strengths", e.target.value)}
                  placeholder="Forces..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Faiblesses
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.weaknesses ?? ""}
                  onChange={(e) => onUpdateField(link.processId, "weaknesses", e.target.value)}
                  placeholder="Faiblesses..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Opportunités
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.opportunities ?? ""}
                  onChange={(e) => onUpdateField(link.processId, "opportunities", e.target.value)}
                  placeholder="Opportunités..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Risques
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.risks ?? ""}
                  onChange={(e) => onUpdateField(link.processId, "risks", e.target.value)}
                  placeholder="Risques..."
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Plan d'actions
                </Typography.Text>
                <Input.TextArea
                  rows={3}
                  value={link.actionPlan ?? ""}
                  onChange={(e) => onUpdateField(link.processId, "actionPlan", e.target.value)}
                  placeholder="Plan d'actions..."
                />
              </div>
            </div>
          ),
        }))}
      />
    </div>
  );
}
