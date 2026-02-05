import {
  CalendarOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  List,
  Popover,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import type { ObjectiveBlock, ProcessFull } from "../../../shared/types";
import type { NormalizedDoc } from "../../../shared/utils";
import { ObjectivesBlocksRenderer } from "./ObjectivesBlocksRenderer";
import antdConfig from "../../../antConfig";

type Props = {
  process: ProcessFull;
  stakeholders: string[];
  docs: NormalizedDoc[];
  objectivesBlocks: ObjectiveBlock[] | null;
  objectives: string[];
  statusLabel?: string;
  versionLabel?: string;
  applicationDate?: string;
};

/**
 * Carte héro (header bleu) de la page ProcessPage.
 * Affiche le titre, statut, pilotes, objectifs, stakeholders et documents.
 */
export function ProcessHeroCard({
  process,
  stakeholders,
  docs,
  objectivesBlocks,
  objectives,
  statusLabel = "Validé",
  versionLabel = "3.0",
  applicationDate = "22/12/2025",
}: Props) {
  const headerBg = "linear-gradient(135deg,#0069c8 0%,#0069c8 50%,rgb(2, 80, 152) 100%)";

  return (
    <Card
      bordered={false}
      style={{
        marginBottom: 24,
        borderRadius: 12,
        overflow: "hidden", // IMPORTANT: permet de garder l'arrondi sur les 2 couleurs
        fontFamily: "font-display, sans-serif",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}
      bodyStyle={{ padding: 0 }} // IMPORTANT
    >
      {/* HEADER BLEU */}
      <div style={{ background: headerBg, padding: 32 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={24} align="middle" wrap>
            <Col flex="auto">
              <div>
                <Typography.Title
                  level={2}
                  style={{
                    margin: 0,
                    color: "white",
                    fontSize: 28,
                    fontWeight: 800,
                    fontFamily: "Akrobat",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  Processus {process.name}
                </Typography.Title>

                <Typography.Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 14,
                    marginTop: 8,
                    display: "block",
                  }}
                >
                  {process.title || "Aucune description disponible"}
                </Typography.Text>
              </div>
            </Col>

            <Col>
              <Space size="large" wrap>
                <Space direction="vertical" size={4}>
                  <Typography.Text style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", display: "block" }}>
                    Statut
                  </Typography.Text>
                  <Badge
                    status="success"
                    text={<span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{statusLabel}</span>}
                  />
                </Space>

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.22)", height: 40 }} />

                <Space direction="vertical" size={4}>
                  <Typography.Text style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", display: "block" }}>
                    Version
                  </Typography.Text>
                  <Space>
                    <TagOutlined style={{ color: "rgba(255,255,255,0.85)" }} />
                    <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{versionLabel}</span>
                  </Space>
                </Space>

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.22)", height: 40 }} />

                <Space direction="vertical" size={4}>
                  <Typography.Text style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", display: "block" }}>
                    Date d'application
                  </Typography.Text>
                  <Space>
                    <CalendarOutlined style={{ color: "rgba(255,255,255,0.85)" }} />
                    <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{applicationDate}</span>
                  </Space>
                </Space>

                <Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.22)", height: 40 }} />

                <Space direction="vertical" size={4}>
                  <Typography.Text style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", display: "block" }}>
                    Pilote
                  </Typography.Text>
                  <Space>
                    <Avatar
                      icon={<UserOutlined />}
                      size="small"
                      style={{
                        background: "rgba(255,255,255,0.20)",
                        border: "1.5px solid rgba(255,255,255,0.26)",
                      }}
                    />
                    {process.pilots && process.pilots.length > 0 ? (
                      <Space size={6}>
                        <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{process.pilots[0].name}</span>
                        {process.pilots.length > 1 && (
                          <Popover
                            content={
                              <Space size={[6, 6]} wrap>
                                {process.pilots.slice(1).map((p) => (
                                  <Tag key={p.id}>{p.name}</Tag>
                                ))}
                              </Space>
                            }
                            trigger="hover"
                          >
                            <Tag
                              style={{
                                background: "rgba(255,255,255,0.2)",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                margin: 0,
                              }}
                            >
                              +{process.pilots.length - 1}
                            </Tag>
                          </Popover>
                        )}
                      </Space>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>—</span>
                    )}
                  </Space>
                </Space>
              </Space>
            </Col>
          </Row>
        </Space>
      </div>

      {/* Séparateur entre header et body */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

      {/* BODY BLANC */}
      <div style={{ background: "white", padding: "24px 32px" }}>
        <Row gutter={24}>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Space align="center">
                <InfoCircleOutlined style={{ color: antdConfig.token!.colorPrimary, fontSize: 18 }} />
                <Typography.Text style={{ color: antdConfig.token!.colorPrimary, fontWeight: 800, fontSize: 20, fontFamily: "Akrobat", }}>
                  Objectifs du processus
                </Typography.Text>
              </Space>

              {objectivesBlocks ? (
                <ObjectivesBlocksRenderer blocks={objectivesBlocks} />
              ) : (
                <List
                  size="small"
                  dataSource={objectives}
                  renderItem={(item, idx) => (
                    <List.Item style={{ border: "none", padding: "6px 0" }}>
                      <Typography.Text style={{ color: "#0B1F3B", fontSize: 14, lineHeight: 1.6 }}>
                        <span style={{ fontWeight: 900, marginRight: 8, color: "#007BC4" }}>{idx + 1}.</span>
                        {item}
                      </Typography.Text>
                    </List.Item>
                  )}
                />
              )}
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Space align="center">
                <TeamOutlined style={{ color: "#007BC4", fontSize: 18 }} />
                <Typography.Text style={{ color: antdConfig.token!.colorPrimary, fontWeight: 800, fontSize: 20, fontFamily: "Akrobat", }}>
                  Parties intéressées
                </Typography.Text>
              </Space>

              <Space wrap>
                {stakeholders.length > 0 ? (
                  stakeholders.map((s) => (
                    <Tag
                      key={s}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(0,123,196,0.25)",
                        color: "#0B1F3B",
                        fontSize: 13,
                        padding: "4px 10px",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {s}
                    </Tag>
                  ))
                ) : (
                  <Typography.Text style={{ color: "rgba(11,31,59,0.65)", fontSize: 14 }}>
                    Aucune partie intéressée définie
                  </Typography.Text>
                )}
              </Space>
            </Space>
          </Col>

          <Col xs={24} md={8}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Space align="center">
                <FileTextOutlined style={{ color: "#007BC4", fontSize: 18 }} />
                <Typography.Text style={{ color: antdConfig.token!.colorPrimary, fontWeight: 800, fontSize: 20, fontFamily: "Akrobat", }}>
                  Documents de référence
                </Typography.Text>
              </Space>

              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                {docs.length > 0 ? (
                  docs.map((d, idx) => (
                    <Space key={`${d.code}-${idx}`} style={{ width: "100%", justifyContent: "space-between" }}>
                      {d.url ? (
                        <Button
                          type="link"
                          icon={
                            // <FileWordOutlined /> ou <FilePdfOutlined />
                            d.type === "PDF" ? <FilePdfOutlined style={{ color: "#E03E2F", fontSize: 18 }} /> : <FileTextOutlined style={{ color: "#007BC4", fontSize: 18 }} />
                          }
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          style={{ padding: 0, height: "auto", color: "#007BC4", fontWeight: 700 }}
                        >
                          <Typography.Text style={{ color: "#0B1F3B", fontSize: 14, fontWeight: 700 }}>
                            <span>  {d.title}.{d.type || "PDF"}</span>
                          </Typography.Text>
                        </Button>
                      ) : (
                        <Typography.Text style={{ color: "rgba(11,31,59,0.65)", fontSize: 14 }}>
                          {d.code} — {d.title}.{d.type || "PDF"}
                        </Typography.Text>
                      )}
                    </Space>
                  ))
                ) : (
                  <Typography.Text style={{ color: "rgba(11,31,59,0.65)", fontSize: 14 }}>
                    Aucun document de référence
                  </Typography.Text>
                )}
              </Space>
            </Space>
          </Col>
        </Row>
      </div>
    </Card>
  );
}

