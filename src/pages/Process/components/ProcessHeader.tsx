import React from "react";
import { Badge, Button, Col, Divider, Row, Space, Typography, Avatar, List, Tag, Card } from "antd";
import { CalendarOutlined, TagOutlined, UserOutlined, InfoCircleOutlined, FileTextOutlined, TeamOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import type { ProcessFull } from "../../../types";

type ReferenceDoc = { code: string; title: string; type?: string; url?: string };

type Props = {
    process: ProcessFull;
    breadcrumb: string;
    objectives: string[];
    stakeholders: string[];
    docs: ReferenceDoc[];
};

export default function ProcessHeader({ process, breadcrumb }: Props) {
    const { objectives = [], stakeholders = [], docs = [] } = (arguments[0] as Props) || {};
    const statusLabel = "Validé";
    const versionLabel = "3.0";
    const applicationDate = "22/12/2025";
    const pilotName = "Jean Dupont";

    return (
        <div>
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
                                <Space align="center">
                                    <InfoCircleOutlined style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }} />
                                    <Typography.Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 14 }}>
                                        Objectifs du processus
                                    </Typography.Text>
                                </Space>
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
        </div>

    );
}
