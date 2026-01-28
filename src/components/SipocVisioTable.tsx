import { Card, Col, Row, Space, Tag, Tooltip, Typography } from "antd";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./SipocVisioTable.css";

type DesignationTarget =
  | { type: "url"; url: string }
  | { type: "process"; processId: string };

export type SipocDesignation = {
  name?: string;
  url?: string;
  target?: DesignationTarget;
};

export type SipocRow = {
  ref?: string;
  // Ancien format (pour compatibilité)
  processusFournisseur?: string;
  entrees?: string;
  numero?: number | string;
  ressources?: string;
  designation?: SipocDesignation;
  sorties?: string;
  processusClient?: string;

  // Nouveau format
  designationProcessusVendre?: SipocDesignation;
  activitePhase?: SipocDesignation;
  sortiesProcessusVendre?: string;
  designationProcessusClient?: string;
  sortiesProcessusClient?: string;

  // IMPORTANT: phase (depuis le seed)
  phase?: string;
};

type SipocPhase = {
  key?: string;
  name?: string;
  rows?: SipocRow[];
};

export function SipocVisioTable(props: {
  title: string;
  rows: SipocRow[];
  phases?: SipocPhase[];
  focusRef?: string | null;
}) {
  const navigate = useNavigate();

  const focusKey = (props.focusRef ?? "").trim();
  const rows = useMemo(() => props.rows ?? [], [props.rows]);

  // Adapter les données de l'ancien format vers le nouveau format
  const adaptedRows = useMemo(() => {
    return rows.map((r) => {
      // Si déjà au nouveau format, garder
      if (r.activitePhase || r.designationProcessusVendre) return r;

      // Adapter ancien -> nouveau
      return {
        ...r,
        designationProcessusVendre: r.designation,
        activitePhase: r.designation,
        sortiesProcessusVendre: r.sorties,
        designationProcessusClient: r.processusClient,
        sortiesProcessusClient: r.sortiesProcessusClient || "",
      };
    });
  }, [rows]);

  const groups = useMemo(() => {
    // 1) If phases are provided, prefer them (already ordered)
    if (Array.isArray(props.phases) && props.phases.length) {
      return props.phases
        .map((p, idx) => ({
          key: String(p.key || idx),
          name: String(p.name || `Phase ${idx + 1}`),
          rows: (Array.isArray(p.rows) ? p.rows : []).map((r) => ({ ...r, phase: r.phase || p.name }))
        }))
        .filter((g) => g.rows.length);
    }

    // 2) Otherwise group by row.phase (or fallback)
    const order: string[] = [];
    const map = new Map<string, SipocRow[]>();
    for (const r of adaptedRows) {
      const name = String(r.phase || "Phase unique");
      if (!map.has(name)) {
        map.set(name, []);
        order.push(name);
      }
      map.get(name)!.push({ ...r, phase: name });
    }
    return order.map((name, idx) => ({ key: String(idx), name, rows: map.get(name) || [] }));
  }, [adaptedRows, props.phases]);

  const isFocused = (r: SipocRow) => {
    if (!focusKey) return false;
    const ref = String(r?.ref || "");
    const num = String(r?.numero ?? "");
    const activiteName = String(r?.activitePhase?.name || r?.designation?.name || "");
    return (
      ref === focusKey ||
      num === focusKey ||
      activiteName.toLowerCase() === focusKey.toLowerCase()
    );
  };

  const resolveDesignationUrl = (designation?: SipocDesignation): string | null => {
    if (!designation) return null;
    const t = designation?.target;
    if (t?.type === "url") return t.url;
    if (t?.type === "process") return `/process/${t.processId}`;
    if (designation?.url) return designation.url;
    return null;
  };

  const renderDesignation = (designation?: SipocDesignation) => {
    if (!designation) return null;
    const url = resolveDesignationUrl(designation);
    const label = (designation?.name || url || "") as string;

    if (!url) return label || null;

    if (url.startsWith("/process/")) {
      return (
        <Tooltip title="Ouvrir le processus">
          <a
            className="text-[#2563eb] font-bold underline hover:text-[#1d4ed8] cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              navigate(url);
            }}
          >
            {label}
          </a>
        </Tooltip>
      );
    }

    return (
      <a
        className="text-[#2563eb] font-bold underline hover:text-[#1d4ed8]"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {label}
      </a>
    );
  };

  return (
    <div className="sipoc-card-container">
      {/* Header Section */}
      <Card className="sipoc-header-card" bodyStyle={{ padding: 0 }}>
        <Row gutter={0} className="sipoc-header-row">
          <Col span={3} className="sipoc-header-col">
            <Typography.Text strong className="sipoc-header-text">Réf.</Typography.Text>
          </Col>
          <Col span={4} className="sipoc-header-col">
            <Typography.Text strong className="sipoc-header-text">Processus fournisseur</Typography.Text>
          </Col>
          <Col span={13} className="sipoc-header-col sipoc-header-processus">
            <div>
              <Typography.Text strong className="sipoc-header-text">{props.title}</Typography.Text>

              <div className="sipoc-sub-header">
                <Typography.Text strong className="sipoc-sub-header-text">Activité</Typography.Text>
              </div>

              <Row gutter={0} className="sipoc-sub-sub-header">
                <Col span={5} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">Entrées</Typography.Text>
                </Col>
                <Col span={4} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">N°</Typography.Text>
                </Col>
                <Col span={5} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">Ressources</Typography.Text>
                </Col>
                <Col span={5} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">Désignation</Typography.Text>
                </Col>
                <Col span={5} className="sipoc-sub-header-col">
                  <Typography.Text strong className="sipoc-sub-header-text">Sorties</Typography.Text>
                </Col>
              </Row>

              <div className="sipoc-phase-header">
                <Typography.Text strong className="sipoc-phase-text">Phase</Typography.Text>
              </div>
            </div>
          </Col>
          <Col span={4} className="sipoc-header-col">
            <Typography.Text strong className="sipoc-header-text">Processus client</Typography.Text>
          </Col>
        </Row>
      </Card>

      {/* Data Rows (groupées par phase) */}
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {groups.map((ph) => (
          <div key={ph.key || ph.name}>
            {/* Petit header de phase */}
            <Card
              className="sipoc-phase-card"
              bodyStyle={{ padding: "10px 16px" }}
              style={{ borderRadius: 12 }}
            >
              <Typography.Text strong className="sipoc-phase-title">
                {ph.name || "Phase"}
              </Typography.Text>
            </Card>

            {/* Lignes de la phase */}
            <Space direction="vertical" size={0} style={{ width: "100%" }}>
              {(ph.rows || []).map((r, idx) => (
                <Card
                  key={String(r?.ref || `${ph.key}-${idx}`)}
                  className={`sipoc-row-card ${isFocused(r) ? "sipoc-row-focused" : ""}`}
                  bodyStyle={{ padding: "12px 16px" }}
                >
                  <Row gutter={16} align="middle">
                    <Col span={3}>
                      <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                        {r?.ref}
                      </Tag>
                    </Col>

                    <Col span={4}>
                      <Typography.Text>{r?.processusFournisseur}</Typography.Text>
                    </Col>

                    <Col span={13}>
                      <Row gutter={8}>
                        <Col span={5}>
                          <Typography.Text type="secondary">{r?.entrees}</Typography.Text>
                        </Col>

                        <Col span={4} style={{ textAlign: "center" }}>
                          <Tag color="default" style={{ margin: 0 }}>
                            {r?.numero}
                          </Tag>
                        </Col>

                        <Col span={5}>
                          <Typography.Text>{r?.ressources}</Typography.Text>
                        </Col>

                        <Col span={5}>
                          {renderDesignation(r?.designationProcessusVendre || r?.designation) || (
                            <Typography.Text>
                              {r?.designation?.name && !r.designation.url && !r.designation.target
                                ? r.designation.name
                                : null}
                            </Typography.Text>
                          )}
                        </Col>

                        <Col span={5}>
                          <Typography.Text>{r?.sortiesProcessusVendre || r?.sorties}</Typography.Text>
                        </Col>
                      </Row>
                    </Col>

                    <Col span={4}>
                      <Typography.Text>{r?.designationProcessusClient || r?.processusClient}</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </div>
        ))}
      </Space>
    </div>
  );
}
