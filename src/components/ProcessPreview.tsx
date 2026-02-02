import {
  FileSearchOutlined,
  FileTextOutlined,
  TeamOutlined,
  TagOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Avatar, Badge, Button, Card, Col, Divider, Modal, Row, Space, Tag, Typography } from "antd";
import { useState } from "react";
import LogigrammeViewer from "./logigramme/LogigrammeViewer";
import { SipocVisioTable } from "./sipoc/SipocVisioTable";


type ProcessPreviewData = {
  code: string;
  name: string;
  title?: string;
  objectives?: string;
  stakeholders?: any[];
  referenceDocuments?: any[];
  sipoc?: { rows: any[] };
  logigramme?: any;
};

type ReferenceDoc = {
  code: string;
  title: string;
  type?: string;
  url?: string;
};


function processBadgeFromCode(code: string) {
  return `PR-${code}-01`;
}

function normalizeStakeholders(input: unknown): string[] {
  if (Array.isArray(input) && input.every((x) => typeof x === "string")) return input;
  return [];
}

function normalizeDocs(input: unknown): ReferenceDoc[] {
  if (Array.isArray(input)) {
    return input
      .map((d: any) => ({
        code: String(d?.code || ""),
        title: String(d?.title || ""),
        type: d?.type ? String(d.type) : "PDF",
        url: d?.url ? String(d.url) : undefined,
      }))
      .filter((d) => d.code && d.title);
  }
  return [];
}

export default function ProcessPreview({ data }: { data: ProcessPreviewData | null }) {
  const [sipocOpen, setSipocOpen] = useState(false);
  const [sipocFocusRef, setSipocFocusRef] = useState<string | null>(null);

  const closeSipoc = () => {
    setSipocOpen(false);
    setSipocFocusRef(null);
  };

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        <p>Créez d'abord un processus pour voir l'aperçu</p>
      </div>
    );
  }

  const statusLabel = "Validé";
  const versionLabel = "3.0";
  const applicationDate = "22/12/2025";
  const pilotName = "Jean Dupont";

  const stakeholders = normalizeStakeholders(data.stakeholders);
  const docs = normalizeDocs(data.referenceDocuments);

  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        background: "#f5f5f5", 
        padding: "24px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div 
        style={{ 
          maxWidth: 1200, 
          margin: "0 auto",
          position: "relative"
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {data.name} › Général › Processus {data.name}
          </Typography.Text>
        </Space>

        <Card 
          bordered={false} 
          style={{ 
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", 
            marginBottom: 24,
            borderRadius: 12
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Row gutter={24} align="middle" wrap>
              <Col flex="auto">
                <div>
                  <Typography.Title level={2} style={{ margin: 0, color: "white", fontSize: 28, fontWeight: 800 }}>
                    Processus {data.name}
                  </Typography.Title>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 8, display: "block" }}>
                    {data.title || "Aucune description disponible"}
                  </Typography.Text>
                </div>
              </Col>
              <Col>
                <Space size="large" wrap>
                  <Space direction="vertical" size={4}>
                    <Typography.Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "block" }}>
                      Statut
                    </Typography.Text>
                    <Badge
                      status="success"
                      text={<span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{statusLabel}</span>}
                    />
                  </Space>

                  <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.2)", height: 40 }} />

                  <Space direction="vertical" size={4}>
                    <Typography.Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "block" }}>
                      Version
                    </Typography.Text>
                    <Space>
                      <TagOutlined style={{ color: "rgba(255,255,255,0.8)" }} />
                      <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{versionLabel}</span>
                    </Space>
                  </Space>

                  <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.2)", height: 40 }} />

                  <Space direction="vertical" size={4}>
                    <Typography.Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "block" }}>
                      Date d'application
                    </Typography.Text>
                    <Space>
                      <CalendarOutlined style={{ color: "rgba(255,255,255,0.8)" }} />
                      <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{applicationDate}</span>
                    </Space>
                  </Space>

                  <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.2)", height: 40 }} />

                  <Space direction="vertical" size={4}>
                    <Typography.Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", display: "block" }}>
                      Pilote
                    </Typography.Text>
                    <Space>
                      <Avatar 
                        icon={<UserOutlined />} 
                        size="small"
                        style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)" }}
                      />
                      <Space direction="vertical" size={0}>
                        <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{pilotName}</span>
                        <Button
                          type="link"
                          size="small"
                          style={{ color: "rgba(255,255,255,0.9)", padding: 0, height: "auto", fontSize: 12 }}
                          onClick={() => alert("Détails pilote (placeholder)")}
                        >
                          Voir détails
                        </Button>
                      </Space>
                    </Space>
                  </Space>
                </Space>
              </Col>
            </Row>

            <Divider style={{ borderColor: "rgba(255,255,255,0.15)", margin: "16px 0" }} />

            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 14 }}>
                    Objet du processus
                  </Typography.Text>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.6 }}>
                    {data.title || "Aucun objet défini pour ce processus."}
                  </Typography.Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space align="center">
                    <TeamOutlined style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }} />
                    <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 14 }}>
                      Parties intéressées
                    </Typography.Text>
                  </Space>
                  <Space wrap>
                    {stakeholders.length > 0 ? (
                      stakeholders.map((s) => (
                        <Tag 
                          key={s} 
                          style={{ 
                            background: "rgba(255,255,255,0.15)", 
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "white",
                            fontSize: 12
                          }}
                        >
                          {s}
                        </Tag>
                      ))
                    ) : (
                      <Typography.Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                        Aucune partie intéressée définie
                      </Typography.Text>
                    )}
                  </Space>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space align="center">
                    <FileTextOutlined style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }} />
                    <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 14 }}>
                      Documents de référence
                    </Typography.Text>
                  </Space>
                  <Space direction="vertical" size={6} style={{ width: "100%" }}>
                    {docs.length > 0 ? (
                      docs.map((d, idx) => (
                        <Space key={`${d.code}-${idx}`} style={{ width: "100%", justifyContent: "space-between" }}>
                          <Space>
                            <FileTextOutlined style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }} />
                            <Space direction="vertical" size={0}>
                              <Typography.Text style={{ color: "white", fontSize: 12, fontWeight: 600 }}>
                                {d.code} — {d.title}
                              </Typography.Text>
                              <Typography.Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                                {d.type || "PDF"}
                              </Typography.Text>
                            </Space>
                          </Space>
                          {d.url && (
                            <Button
                              type="text"
                              icon={<FileTextOutlined />}
                              href={d.url}
                              target="_blank"
                              rel="noreferrer"
                              size="small"
                              style={{ color: "rgba(255,255,255,0.9)" }}
                            />
                          )}
                        </Space>
                      ))
                    ) : (
                      <Typography.Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                        Aucun document de référence
                      </Typography.Text>
                    )}
                  </Space>
                </Space>
              </Col>
            </Row>
          </Space>
        </Card>

        <Card 
          style={{ borderRadius: 12 }}
          bodyStyle={{ padding: 24 }}
        >
          <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <Space align="center" style={{ marginBottom: 8 }}>
                <Avatar 
                  icon={<FileSearchOutlined />} 
                  size="small"
                  style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", color: "#2563eb" }}
                />
                <Typography.Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
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
            {/* Logigramme à gauche */}
            <Col xs={24} lg={18}>
              <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, height: "calc(100vh - 420px)", minHeight: 500, maxHeight: 800, overflow: "hidden", background: "white" }}>
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

            {/* Légende à droite */}
            <Col xs={24} lg={6}>
              <Card 
                size="small"
                style={{ borderRadius: 8, height: "calc(100vh - 420px)", minHeight: 500, maxHeight: 800 }}
                bodyStyle={{ padding: 16, height: "100%", overflow: "auto" }}
                title={
                  <Typography.Text strong style={{ fontSize: 14 }}>
                    Légende
                  </Typography.Text>
                }
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {Array.isArray(data.logigramme?.legend) && data.logigramme.legend.length ? (
                    data.logigramme.legend.map((it: any, idx: number) => {
                      const color = it.color || "#0ea5e9";
                      const bg = it.bg || "transparent";
                      const key = (it.key || it.number || "").toString();
                      return (
                        <Space key={idx} size={10} style={{ width: "100%" }}>
                          <Badge 
                            count={key} 
                            style={{ 
                              backgroundColor: color,
                              border: `2px solid ${color}`,
                              minWidth: 36,
                              height: 32,
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700
                            }}
                          />
                          <Typography.Text style={{ fontSize: 13, flex: 1 }}>{it.label || ""}</Typography.Text>
                        </Space>
                      );
                    })
                  ) : (
                    <>
                      <Space size={10} style={{ width: "100%" }}>
                        <Badge count="1" style={{ backgroundColor: "#2563eb", minWidth: 36, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 700 }} />
                        <Typography.Text style={{ fontSize: 13, flex: 1 }}>Commercial</Typography.Text>
                      </Space>
                      <Space size={10} style={{ width: "100%" }}>
                        <Badge count="2" style={{ backgroundColor: "#22c55e", minWidth: 36, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 700 }} />
                        <Typography.Text style={{ fontSize: 13, flex: 1 }}>ADV</Typography.Text>
                      </Space>
                    </>
                  )}
                </Space>
              </Card>
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
