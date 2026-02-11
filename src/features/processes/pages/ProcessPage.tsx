import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FileSearchOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Modal,
  Row,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
} from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import LogigrammeViewer from "../../logigramme/components/LogigrammeViewer";
import { SipocVisioTable } from "../../sipoc/components/SipocVisioTable";
import { ProcessHeroCard, ProcessLegend } from "../components";

import { getCartography, getPath, getProcessByCode, getProcessListLite } from "../../../shared/api";
import type { ProcessFull, ProcessLite, PathItem, ProcessStakeholder } from "../../../shared/types";
import { getErrorMessage, normalizeDocs, normalizeObjectives } from "../../../shared/utils";

function getContrastText(hex: string | null | undefined): string {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return "#0b1220";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.5 ? "#0b1220" : "#ffffff";
}

function processBadgeFromCode(code: string) {
  return `PR-${code}-01`;
}

export default function ProcessPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [process, setProcess] = useState<ProcessFull | null>(null);
  const [path, setPath] = useState<PathItem[]>([]);
  const [siblings, setSiblings] = useState<ProcessLite[]>([]);
  const [error, setError] = useState<string>("");

  const [sipocProcessList, setSipocProcessList] = useState<{ id: string; name: string; code: string; processType?: string | null; parentProcessId?: string | null }[]>([]);
  const [sipocOpen, setSipocOpen] = useState(false);
  const [sipocFocusRef, setSipocFocusRef] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  const closeSipoc = useCallback(() => {
    setSipocOpen(false);
    setSipocFocusRef(null);
  }, []);

  // Load process data
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
          const cartoData = await getCartography().then((r) => r.data);
          if (!alive) return;
          const allItems = [
            ...(cartoData.manager ? [cartoData.manager] : []),
            ...(cartoData.valueChain ?? []),
            ...(cartoData.leftPanel ?? []),
            ...(cartoData.rightPanel ?? []),
          ];
          setSiblings(allItems.map((item) => ({
            id: item.process.id,
            code: item.process.code,
            name: item.label ?? item.process.name,
            parentProcessId: null,
            orderInParent: item.slotOrder,
            isActive: true,
            color: item.process.color ?? null,
          })));
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

  // Fetch lightweight process list for SIPOC display
  useEffect(() => {
    getProcessListLite()
      .then((res) => setSipocProcessList(res.data))
      .catch(() => { });
  }, []);

  // Breadcrumb items from path hierarchy
  const breadcrumbItems = useMemo(() => {
    const items: { title: React.ReactNode; href?: string }[] = [
      { title: <><HomeOutlined /> Cartographie</>, href: "/" },
    ];
    if (path.length > 0) {
      // All path items except the last (current) are clickable
      for (let i = 0; i < path.length - 1; i++) {
        items.push({
          title: path[i].name,
          href: `/process/${path[i].code}`,
        });
      }
    }
    if (process) {
      items.push({ title: process.name });
    }
    return items;
  }, [process, path]);

  // Steps: all siblings, current highlighted
  const stepsData = useMemo(() => {
    if (!process || siblings.length < 2) return null;
    const idx = siblings.findIndex((s) => s.code === process.code);
    if (idx < 0) return null;
    return { current: idx, items: siblings };
  }, [process, siblings]);

  const canNav = siblings.length >= 2;

  // Normalise les stakeholders en s'assurant qu'on a des ProcessStakeholder[]
  const stakeholders: ProcessStakeholder[] = Array.isArray(process?.stakeholders)
    ? process.stakeholders.filter((s): s is ProcessStakeholder => !!s && typeof s === "object" && "id" in s)
    : [];


  const docs = normalizeDocs(process?.referenceDocuments);
  const objectivesBlocks =
    Array.isArray(process?.objectivesBlocks) && process.objectivesBlocks.length > 0
      ? process.objectivesBlocks
      : null;
  const objectives = objectivesBlocks ? [] : normalizeObjectives((process as any)?.objectives);

  // Navigation between siblings
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

  // Keyboard shortcuts
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

  // Error state
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

  // Loading state
  if (!process) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
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
        overflow: "hidden",
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
          opacity: isTransitioning ? 0 : 1,
        }}
      >
        {/* Navigation bar: Breadcrumb (left) + Steps (right) */}
        <div style={{ marginBottom: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            href="/"
            style={{ padding: "4px 12px", marginBottom: 8 }}
          >
            Retour à la cartographie
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-2"
          >
            <Breadcrumb items={breadcrumbItems} style={{ fontSize: 13 }} />
            {stepsData && (
              <Steps
                size="small"
                type="inline"
                current={stepsData.current}
                style={{ maxWidth: 600, flex: "0 1 auto" }}
                onChange={(idx) => {
                  if (idx === stepsData.current) return;
                  const target = stepsData.items[idx];
                  if (target) navigate(`/process/${target.code}`);
                }}
                items={stepsData.items.map((s, i) => ({
                  title: s.name,
                  disabled: i === stepsData.current,
                }))}
              />
            )}
          </div>
        </div>

        {/* Hero card */}
        <ProcessHeroCard
          process={process}
          stakeholders={stakeholders}
          docs={docs}
          objectivesBlocks={objectivesBlocks}
          objectives={objectives}
        />
        {/* divider */}
        <Divider />

        {/* Logigramme section */}
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
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
            </>
          )}

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
                <Button type="primary" icon={<FileSearchOutlined />} onClick={() => setSipocOpen(true)} size="middle">
                  Voir le tableau SIPOC
                </Button>
                <Tag color="blue" style={{ fontSize: 12, padding: "6px 14px", fontWeight: 600 }}>
                  {processBadgeFromCode(process.code)}
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
                    logigramme={process.logigramme}
                    sipocRows={process.sipoc?.rows || []}
                    onOpenSipocRow={(key) => {
                      setSipocFocusRef(String(key));
                      setSipocOpen(true);
                    }}
                  />
                </div>
              </Col>
              <Col xs={24} lg={6}>
                <ProcessLegend logigramme={process.logigramme} />
              </Col>
            </Row>
          </Card>
        </div>

        {/* SIPOC Modal */}
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
                processList={sipocProcessList}
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
