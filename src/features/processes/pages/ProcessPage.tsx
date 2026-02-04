import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  List,
  Modal,
  Popover,
  Row,
  Space,
  Spin,
  Tag,
  Typography
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LogigrammeViewer from "../../logigramme/components/LogigrammeViewer";
import { SipocVisioTable } from "../../sipoc/components/SipocVisioTable";
import { getCartography, getPath, getProcessByCode } from "../../../shared/api";
import type { ProcessFull, ProcessLite, PathItem, ObjectiveBlock } from "../../../shared/types";
import { getErrorMessage } from "../../../shared/utils/error";
import { normalizeDocs, normalizeStakeholders, normalizeObjectives, type NormalizedDoc } from "../../../shared/utils/normalize";

type ReferenceDoc = NormalizedDoc;

function processBadgeFromCode(code: string) {
  return `PR-${code}-01`;
}

// Rendu des objectivesBlocks structurés
function ObjectivesBlocksRenderer({ blocks }: { blocks: ObjectiveBlock[] }) {
  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          return (
            <Typography.Text
              key={idx}
              style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.6, display: "block", marginBottom: 8 }}
            >
              {block.text}
            </Typography.Text>
          );
        }

        const items = block.items.filter((it) => it.trim());
        if (!items.length) return null;

        return (
          <List
            key={idx}
            size="small"
            dataSource={items}
            style={{ marginBottom: 8 }}
            renderItem={(item, itemIdx) => (
              <List.Item style={{ border: "none", padding: "4px 0" }}>
                <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 800, marginRight: 8, color: "rgba(255, 255, 255, 0.85)", minWidth: 20, display: "inline-block" }}>
                    {block.type === "numbered" ? `${itemIdx + 1}.` : "•"}
                  </span>
                  {item}
                </Typography.Text>
              </List.Item>
            )}
          />
        );
      })}
    </>
  );
}

export default function ProcessPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [process, setProcess] = useState<ProcessFull | null>(null);
  const [path, setPath] = useState<PathItem[]>([]);
  const [siblings, setSiblings] = useState<ProcessLite[]>([]);
  const [error, setError] = useState<string>("");

  const [sipocOpen, setSipocOpen] = useState(false);
  const [sipocFocusRef, setSipocFocusRef] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  const closeSipoc = useCallback(() => {
    setSipocOpen(false);
    setSipocFocusRef(null);
  }, []);

  useEffect(() => {
    if (!code) return;

    let alive = true;

    (async () => {
      setError("");
      setProcess(null);
      setPath([]);
      setSiblings([]);
      closeSipoc();

      try {
        const procRes = await getProcessByCode(code);
        if (!alive) return;

        const proc = procRes.data;
        setProcess(proc);

        const pathItems: PathItem[] = await getPath((proc as any).id || "")
          .then((r) => (Array.isArray(r.data) ? (r.data as any as PathItem[]) : []))
          .catch(() => []);
        if (!alive) return;
        setPath(pathItems);

        if (!proc.parentProcessId) {
          const roots = await getCartography().then((r) => r.data);
          if (!alive) return;
          setSiblings(roots);
          return;
        }

        const parentCode = pathItems.length >= 2 ? pathItems[pathItems.length - 2].code : null;
        if (!parentCode) {
          setSiblings([]);
          return;
        }

        const parentRes = await getProcessByCode(parentCode);
        if (!alive) return;
        setSiblings(parentRes.data.children || []);
      } catch (e) {
        if (!alive) return;
        setError(getErrorMessage(e));
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const breadcrumb = useMemo(() => {
    if (!process) return "";
    const rootName = path?.[0]?.name || process.name;
    return `${rootName} › Général › Processus ${process.name}`;
  }, [process, path]);

  const canNav = siblings.length >= 2;

  const goDelta = useCallback(
    (delta: number) => {
      if (!process || !canNav || isTransitioning) return;

      const idx = siblings.findIndex((s) => s.code === process.code);
      if (idx < 0) return;

      setIsTransitioning(true);
      setSlideDirection(delta > 0 ? "right" : "left");

      setTimeout(() => {
        const next = siblings[(idx + delta + siblings.length) % siblings.length];
        navigate(`/process/${next.code}`);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 300);
    },
    [process, siblings, navigate, canNav, isTransitioning]
  );

  const goNext = useCallback(() => goDelta(+1), [goDelta]);
  const goPrev = useCallback(() => goDelta(-1), [goDelta]);

  // (gardé, même si non utilisé ici)
  const handleProcessChange = useCallback((code: string) => {
    navigate(`/process/${code}`);
  }, [navigate]);

  // Raccourcis clavier pour naviguer entre les processus
  useEffect(() => {
    if (!canNav) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [canNav, goNext, goPrev]);

  const statusLabel = "Validé";
  const versionLabel = "3.0";
  const applicationDate = "22/12/2025";

  const stakeholders = normalizeStakeholders(process?.stakeholders);
  const docs = normalizeDocs(process?.referenceDocuments);

  // ✅ objectifs
  const objectivesBlocks = Array.isArray(process?.objectivesBlocks) && process.objectivesBlocks.length > 0
    ? process.objectivesBlocks
    : null;
  const objectives = objectivesBlocks ? [] : normalizeObjectives((process as any)?.objectives);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "40px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Alert
            message="Erreur de chargement"
            description={error}
            type="error"
            showIcon
            icon={<InfoCircleOutlined />}
            action={
              <Button size="small" danger onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Typography.Text type="secondary">Chargement du processus...</Typography.Text>
        </Space>
      </div>
    );
  }

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
          position: "relative",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out",
          transform: isTransitioning
            ? `translateX(${slideDirection === "right" ? "-100%" : "100%"})`
            : "translateX(0)",
          opacity: isTransitioning ? 0 : 1
        }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            href="/"
            style={{ padding: "4px 12px" }}
          >
            Retour à la cartographie
          </Button>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>{breadcrumb}</Typography.Text>
        </Space>

        <Card
          bordered={false}
          style={{
            background: "linear-gradient(135deg,#0069c8 0%,#0069c8 50%,rgb(2, 80, 152) 100%)",
            marginBottom: 24,
            borderRadius: 12
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Row gutter={24} align="middle" wrap>
              <Col flex="auto">
                <div>
                  <Typography.Title level={2} style={{ margin: 0, color: "white", fontSize: 28, fontWeight: 800, fontFamily: "Akrobat", letterSpacing: 1.2, textTransform: "uppercase" }}>
                    Processus {process.name}
                  </Typography.Title>
                  <Typography.Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 8, display: "block" }}>
                    {process.title || "Aucune description disponible"}
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
                      {process.pilots && process.pilots.length > 0 ? (
                        <Space size={6}>
                          <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>
                            {process.pilots[0].name}
                          </span>
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
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                +{process.pilots.length - 1}
                              </Tag>
                            </Popover>
                          )}
                        </Space>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>—</span>
                      )}
                    </Space>
                  </Space>
                </Space>
              </Col>
            </Row>

            <Divider style={{ borderColor: "rgba(255,255,255,0.15)", margin: "16px 0" }} />

            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Space align="center">
                    <InfoCircleOutlined style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }} />
                    <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 14 }}>
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
                          <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.6 }}>
                            <span style={{ fontWeight: 800, marginRight: 8, color: "rgba(255, 255, 255, 0.85)" }}>
                              {idx + 1}.
                            </span>
                            {item}
                          </Typography.Text>
                        </List.Item>
                      )}
                    />
                  )}
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

        <div style={{ position: "relative" }}>
          {canNav && (
            <>
              <Button
                type="primary"
                shape="circle"
                icon={<ArrowLeftOutlined />}
                onClick={goPrev}
                size="large"
                style={{
                  position: "absolute",
                  left: -24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  width: 48,
                  height: 48,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              />
              <Button
                type="primary"
                shape="circle"
                icon={<ArrowRightOutlined />}
                onClick={goNext}
                size="large"
                style={{
                  position: "absolute",
                  right: -24,
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  width: 48,
                  height: 48,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              />
            </>
          )}

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
                  {processBadgeFromCode(process.code)}
                </Tag>
              </Space>
            </Space>

            <Row gutter={24}>
              {/* Logigramme à gauche */}
              <Col xs={24} lg={18}>
                <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, height: "calc(100vh - 420px)", minHeight: 500, maxHeight: 800, overflow: "hidden", background: "white" }}>
                  <LogigrammeViewer
                    logigramme={process.logigramme}
                    sipocRows={process.sipoc?.rows || []}
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
                    {Array.isArray((process.logigramme as any)?.legend) && (process.logigramme as any).legend.length ? (
                      (process.logigramme as any).legend.map((it: any, idx: number) => {
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
        </div>

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
                SIPOC — {process.name}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Désignation = lien cliquable (name → url). Clic sur une étape du logigramme = focus SIPOC.
              </Typography.Text>
            </Space>
          }
          width={1200}
        >
          {process.sipoc?.rows?.length ? (
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              <SipocVisioTable
                title={`Processus ${process.name}`}
                rows={process.sipoc.rows}
                phases={(process.sipoc as any)?.phases}
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
    </div >
  );
}
