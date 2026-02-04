import React from "react";
import { Avatar, Button, Card, Col, Row, Space, Tag, Typography, Badge } from "antd";
import { FileSearchOutlined } from "@ant-design/icons";
import LogigrammeViewer from "../../logigramme/components/LogigrammeViewer";
import { PathItem, ProcessFull } from "../../../shared/types";

type Props = {
  process: ProcessFull;
  sipocFocus: string | null;
  onOpenSipoc: (key: string | number) => void;
  path: PathItem[];
};

export default function LogigrammeSection({ process, sipocFocus, onOpenSipoc, path }: Props) {
  return (
    <div>
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 24 }}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <Space align="center" style={{ marginBottom: 8 }}>
              <Avatar icon={<FileSearchOutlined />} size="small" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", color: "#2563eb" }} />
              <Typography.Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "Akrobat" }}>
                Logigramme du processus
              </Typography.Title>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginLeft: 38 }}>
              Connecteurs orthogonaux + flèches visibles + clic = focus SIPOC.
            </Typography.Text>
          </div>
          <Space>
            <Button type="primary" icon={<FileSearchOutlined />} onClick={() => onOpenSipoc("")} size="middle">
              Voir le tableau SIPOC
            </Button>
            <Tag color="blue" style={{ fontSize: 12, padding: "6px 14px", fontWeight: 600 }}>
              PR-{process.code}-01
            </Tag>
          </Space>
        </Space>

        <Row gutter={24}>
          <Col xs={24} lg={18}>
            <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, height: "calc(100vh - 420px)", minHeight: 500, maxHeight: 800, overflow: "hidden", background: "white" }}>
              <LogigrammeViewer
                logigramme={process.logigramme}
                sipocRows={process.sipoc?.rows || []}
                onOpenSipocRow={(key) => onOpenSipoc(String(key))}
              />
            </div>
          </Col>

          <Col xs={24} lg={6}>
            <Card
              size="small"
              style={{ borderRadius: 8, height: "calc(100vh - 420px)", minHeight: 500, maxHeight: 800 }}
              bodyStyle={{ padding: 16, height: "100%", overflow: "auto" }}
              title={<Typography.Text strong style={{ fontSize: 14 }}>Légende</Typography.Text>}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {Array.isArray((process.logigramme as any)?.legend) && (process.logigramme as any).legend.length ? (
                  (process.logigramme as any).legend.map((it: any, idx: number) => {
                    const color = it.color || "#0ea5e9";
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
  );
}
