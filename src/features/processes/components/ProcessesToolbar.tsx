import { Button, Col, Input, Row, Select, Space, Typography } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { PROCESS_TYPE_FILTER_OPTIONS } from "../constants";

interface ProcessesToolbarProps {
  q: string;
  onQChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  countDisplayed: number;
  loading: boolean;
  onCreate: () => void;
  onReload: () => void;
}

export function ProcessesToolbar({
  q,
  onQChange,
  typeFilter,
  onTypeFilterChange,
  countDisplayed,
  loading,
  onCreate,
  onReload,
}: ProcessesToolbarProps) {
  return (
    <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 12 }}>
      <Col flex="auto">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Processus
        </Typography.Title>
        <Typography.Text type="secondary">
          {countDisplayed} élément(s) affiché(s)
        </Typography.Text>
      </Col>

      <Col flex="none">
        <Space wrap>
          <Input
            allowClear
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Rechercher (code, nom, pilote...)"
            style={{ width: 600 }}
          />

          <Select
            value={typeFilter}
            onChange={onTypeFilterChange}
            options={PROCESS_TYPE_FILTER_OPTIONS}
            style={{ width: 200 }}
            placeholder="Filtrer par type"
          />

          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            Nouvelle
          </Button>

          <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>
            Rafraîchir
          </Button>
        </Space>
      </Col>
    </Row>
  );
}
