import {
  FileSearchOutlined,
} from "@ant-design/icons";
import { Alert, Avatar, Button, Card, Col, Modal, Row, Space, Tag, Typography } from "antd";
import { useCallback, useState } from "react";
import LogigrammeViewer from "../../logigramme/components/LogigrammeViewer";
import { SipocVisioTable } from "../../sipoc/components/SipocVisioTable";
import { ProcessHeroCard } from "./ProcessHeroCard";
import { ProcessLegend } from "./ProcessLegend";

import type { ProcessFull, ProcessStakeholder } from "../../../shared/types";
import { normalizeDocs, normalizeObjectives } from "../../../shared/utils";

function processBadgeFromCode(code: string) {
  return `PR-${code}-01`;
}

export default function ProcessPreview({ data }: { data: ProcessFull | null }) {
  const [sipocOpen, setSipocOpen] = useState(false);
  const [sipocFocusRef, setSipocFocusRef] = useState<string | null>(null);

  const closeSipoc = useCallback(() => {
    setSipocOpen(false);
    setSipocFocusRef(null);
  }, []);

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        <p>Créez d'abord un processus pour voir l'aperçu</p>
      </div>
    );
  }

  const stakeholders: ProcessStakeholder[] = Array.isArray(data.stakeholders)
    ? data.stakeholders.filter(
        (s): s is ProcessStakeholder => !!s && typeof s === "object" && "id" in s
      )
    : [];

  const docs = normalizeDocs(data.referenceDocuments);
  const objectivesBlocks =
    Array.isArray(data.objectivesBlocks) && data.objectivesBlocks.length > 0
      ? data.objectivesBlocks
      : null;
  const objectives = objectivesBlocks ? [] : normalizeObjectives((data as any)?.objectives);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {data.name} › Général › Processus {data.name}
          </Typography.Text>
        </Space>

        {/* Réutilisation du même composant que ProcessPage */}
        <ProcessHeroCard
          process={data}
          stakeholders={stakeholders}
          docs={docs}
          objectivesBlocks={objectivesBlocks}
          objectives={objectives}
        />

        <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 24 }}>
          <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <Space align="center" style={{ marginBottom: 8 }}>
                <Avatar
                  icon={<FileSearchOutlined />}
                  size="small"
                  style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", color: "#2563eb" }}
                />
                <Typography.Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "Akrobat" }}>
                  Logigramme du processus
                </Typography.Title>
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginLeft: 38 }}>
                Connecteurs orthogonaux + flèches visibles + clic = focus SIPOC.
              </Typography.Text>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<FileSearchOutlined />}
                onClick={() => setSipocOpen(true)}
                size="middle"
              >
                Voir le tableau SIPOC
              </Button>
              <Tag color="blue" style={{ fontSize: 12, padding: "6px 14px", fontWeight: 600 }}>
                {processBadgeFromCode(data.code)}
              </Tag>
            </Space>
          </Space>

          <Row gutter={24}>
            <Col xs={24} lg={18}>
              <div
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  height: "calc(100vh - 420px)",
                  minHeight: 500,
                  maxHeight: 800,
                  overflow: "hidden",
                  background: "white",
                }}
              >
                <LogigrammeViewer
                  logigramme={data.logigramme}
                  sipocRows={data.sipoc?.rows || []}
                  onOpenSipocRow={(key) => {
                    setSipocFocusRef(String(key));
                    setSipocOpen(true);
                  }}
                />
              </div>
            </Col>
            <Col xs={24} lg={6}>
              <ProcessLegend logigramme={data.logigramme} />
            </Col>
          </Row>
        </Card>

        <Modal
          open={sipocOpen}
          onCancel={closeSipoc}
          footer={
            <Button type="primary" onClick={closeSipoc} size="large">
              Fermer
            </Button>
          }
          title={
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Typography.Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                SIPOC — {data.name}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Désignation = lien cliquable (name → url). Clic sur une étape du logigramme = focus SIPOC.
              </Typography.Text>
            </Space>
          }
          width={1200}
        >
          {data.sipoc?.rows?.length ? (
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              <SipocVisioTable
                title={`Processus ${data.name}`}
                rows={data.sipoc.rows}
                phases={(data.sipoc as any)?.phases}
                focusRef={sipocFocusRef}
              />
            </div>
          ) : (
            <Alert
              message="Aucune ligne SIPOC"
              description="Ce processus ne contient pas encore de données SIPOC."
              type="info"
              showIcon
            />
          )}
        </Modal>
      </div>
    </div>
  );
}
