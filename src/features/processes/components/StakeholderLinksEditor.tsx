import { Collapse, Input, Space, Switch, Tag, Typography } from "antd";
import type { StakeholderLinkFields } from "../../../shared/types";

/**
 * Données UI pour la section "Détails par partie intéressée".
 * On garde l'identité (stakeholderId, name, isActive) + les champs enrichis.
 */
export type StakeholderLinkData = {
  stakeholderId: string;
  name: string;
  isActive: boolean;
} & StakeholderLinkFields;

type Props = {
  links: StakeholderLinkData[];
  onUpdateField: (
    stakeholderId: string,
    field: keyof StakeholderLinkFields,
    value: string | null
  ) => void;
  showAdvanced: boolean;
  onShowAdvancedChange: (value: boolean) => void;
};

/**
 * Éditeur des détails par partie intéressée (besoins, attentes, SWOT, etc.)
 */
export function StakeholderLinksEditor({ links, onUpdateField, showAdvanced, onShowAdvancedChange }: Props) {
  if (links.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}>
        <Typography.Text strong>
          Détails par partie intéressée
        </Typography.Text>
        <Space size={8}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Afficher les champs avancés (vue utilisateur)
          </Typography.Text>
          <Switch size="small" checked={showAdvanced} onChange={onShowAdvancedChange} />
        </Space>
      </Space>

      <Collapse
        accordion
        items={links.map((link) => ({
          key: link.stakeholderId,
          label: (
            <span>
              {link.name}
              {!link.isActive && (
                <Tag color="default" style={{ marginLeft: 8 }}>
                  Inactif
                </Tag>
              )}
            </span>
          ),
          children: (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: "800", color: "#0069c8" }}>
                  Besoins
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.needs ?? ""}
                  onChange={(e) => onUpdateField(link.stakeholderId, "needs", e.target.value)}
                  placeholder="Besoins de cette partie intéressée..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: "800", color: "#0069c8" }}>
                  Attentes
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.expectations ?? ""}
                  onChange={(e) => onUpdateField(link.stakeholderId, "expectations", e.target.value)}
                  placeholder="Attentes..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: "800", color: "#0069c8" }}>
                  Éléments d'évaluation
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.evaluationCriteria ?? ""}
                  onChange={(e) =>
                    onUpdateField(link.stakeholderId, "evaluationCriteria", e.target.value)
                  }
                  placeholder="Critères d'évaluation..."
                />
              </div>

              <div>
                <Typography.Text type="secondary" style={{ fontSize: 14, fontWeight: "800", color: "#0069c8" }}>
                  Exigences
                </Typography.Text>
                <Input.TextArea
                  rows={2}
                  value={link.requirements ?? ""}
                  onChange={(e) => onUpdateField(link.stakeholderId, "requirements", e.target.value)}
                  placeholder="Exigences..."
                />
              </div>

              {showAdvanced && (
                <>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 14 }}>, fontWeight: "800", color: "#0069c8"
                      Forces
                    </Typography.Text>
                    <Input.TextArea
                      rows={2}
                      value={link.strengths ?? ""}
                      onChange={(e) => onUpdateField(link.stakeholderId, "strengths", e.target.value)}
                      placeholder="Forces..."
                    />
                  </div>

                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 14 }}>, fontWeight: "800", color: "#0069c8"
                      Faiblesses
                    </Typography.Text>
                    <Input.TextArea
                      rows={2}
                      value={link.weaknesses ?? ""}
                      onChange={(e) => onUpdateField(link.stakeholderId, "weaknesses", e.target.value)}
                      placeholder="Faiblesses..."
                    />
                  </div>

                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 14 }}>, fontWeight: "800", color: "#0069c8"
                      Opportunités
                    </Typography.Text>
                    <Input.TextArea
                      rows={2}
                      value={link.opportunities ?? ""}
                      onChange={(e) =>
                        onUpdateField(link.stakeholderId, "opportunities", e.target.value)
                      }
                      placeholder="Opportunités..."
                    />
                  </div>

                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 14 }}>, fontWeight: "800", color: "#0069c8"
                      Menaces
                    </Typography.Text>
                    <Input.TextArea
                      rows={2}
                      value={link.risks ?? ""}
                      onChange={(e) => onUpdateField(link.stakeholderId, "risks", e.target.value)}
                      placeholder="Menaces..."
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <Typography.Text type="secondary" style={{ fontSize: 14 }}>, fontWeight: "800", color: "#0069c8"
                      Plan d'actions
                    </Typography.Text>
                    <Input.TextArea
                      rows={3}
                      value={link.actionPlan ?? ""}
                      onChange={(e) => onUpdateField(link.stakeholderId, "actionPlan", e.target.value)}
                      placeholder="Plan d'actions..."
                    />
                  </div>
                </>
              )}
            </div>
          ),
        }))}
      />
    </div>
  );
}
