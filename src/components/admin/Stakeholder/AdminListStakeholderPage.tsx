import {
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
  Row,
  Col,
  Tooltip,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  adminCreateStakeholder,
  adminDeleteStakeholder,
  adminListProcesses,
  adminListStakeholders,
  adminPatchStakeholder,
  adminSetStakeholderProcesses,
  type Stakeholder,
} from "../../../api";

type ProcessOption = {
  id: string;
  code: string;
  name: string;
};

type StakeholderWithProcesses = Stakeholder & {
  processIds?: string[];
};

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return String(e);
}

function formatProcessLabel(p: ProcessOption) {
  return `${p.code} — ${p.name}`;
}

function normalizeText(v: any): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export default function AdminStakeholdersPage() {
  const [items, setItems] = useState<StakeholderWithProcesses[]>([]);
  const [loading, setLoading] = useState(false);

  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);

  const processById = useMemo(() => new Map(processes.map((p) => [p.id, p])), [processes]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StakeholderWithProcesses | null>(null);
  const [form] = Form.useForm();

  const [q, setQ] = useState("");
  const [processFilter, setProcessFilter] = useState<string | null>(null);

  async function loadProcesses() {
    try {
      setLoadingProcesses(true);
      const res = await adminListProcesses();
      const list = (res.data || []).map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
      }));
      setProcesses(list);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoadingProcesses(false);
    }
  }

  async function reload() {
    try {
      setLoading(true);
      const res = await adminListStakeholders();
      setItems((res.data || []) as StakeholderWithProcesses[]);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProcesses();
    reload();
  }, []);

  const filteredItems = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return (items || []).filter((s) => {
      const okName = !qq || String(s.name || "").toLowerCase().includes(qq);
      const okProcess = !processFilter || (s.processIds || []).includes(processFilter);
      return okName && okProcess;
    });
  }, [items, q, processFilter]);

  function openCreate() {
    setEditing(null);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      name: "",
      isActive: true,
      processIds: [],

      // new fields
      needs: "",
      expectations: "",
      evaluationCriteria: "",
      requirements: "",
      strengths: "",
      weaknesses: "",
      opportunities: "",
      risks: "",
      actionPlan: "",
    });
  }

  function openEdit(s: StakeholderWithProcesses) {
    setEditing(s);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      name: s.name || "",
      isActive: Boolean(s.isActive ?? true),
      processIds: s.processIds || [],

      // new fields
      needs: s.needs ?? "",
      expectations: s.expectations ?? "",
      evaluationCriteria: s.evaluationCriteria ?? "",
      requirements: s.requirements ?? "",
      strengths: s.strengths ?? "",
      weaknesses: s.weaknesses ?? "",
      opportunities: s.opportunities ?? "",
      risks: s.risks ?? "",
      actionPlan: s.actionPlan ?? "",
    });
  }

  async function saveStakeholder() {
    try {
      const v = await form.validateFields();

      const name = String(v.name || "").trim();
      const isActive = Boolean(v.isActive);
      const processIds: string[] = Array.isArray(v.processIds) ? v.processIds : [];

      if (!name) throw new Error("Le nom est obligatoire");

      const detailsPayload = {
        name,
        isActive,
        needs: normalizeText(v.needs),
        expectations: normalizeText(v.expectations),
        evaluationCriteria: normalizeText(v.evaluationCriteria),
        requirements: normalizeText(v.requirements),
        strengths: normalizeText(v.strengths),
        weaknesses: normalizeText(v.weaknesses),
        opportunities: normalizeText(v.opportunities),
        risks: normalizeText(v.risks),
        actionPlan: normalizeText(v.actionPlan),
      };

      if (!editing?.id) {
        const createRes: any = await adminCreateStakeholder(detailsPayload);
        const createdId: string | undefined =
          createRes?.data?.id || createRes?.data?.stakeholder?.id;

        if (createdId) {
          await adminSetStakeholderProcesses(createdId, processIds);
          message.success("Partie intéressée créée");
          setOpen(false);
          await reload();
          return;
        }

        // fallback si le back ne renvoie pas l'id
        await reload();
        const found = items.find((s) => String(s.name || "").trim() === name);
        if (found?.id) await adminSetStakeholderProcesses(found.id, processIds);

        message.success("Partie intéressée créée");
        setOpen(false);
        await reload();
        return;
      }

      await adminPatchStakeholder(editing.id, detailsPayload);
      await adminSetStakeholderProcesses(editing.id, processIds);

      message.success("Partie intéressée enregistrée");
      setOpen(false);
      await reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  async function doDelete(s: StakeholderWithProcesses) {
    try {
      await adminDeleteStakeholder(s.id);
      message.success("Supprimé");
      if (editing?.id === s.id) setOpen(false);
      await reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  const columns: ColumnsType<StakeholderWithProcesses> = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      width: 260,
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
    },
    {
      title: "Statut",
      key: "isActive",
      width: 120,
      filters: [
        { text: "Actif", value: "true" },
        { text: "Inactif", value: "false" },
      ],
      onFilter: (value, record) => String(Boolean(record.isActive)) === String(value),
      render: (_: any, r: StakeholderWithProcesses) => (
        <Tag color={r.isActive ? "green" : "default"}>{r.isActive ? "Actif" : "Inactif"}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_: any, r: StakeholderWithProcesses) => (
        <Space>
          <Tooltip title="Éditer">
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Supprimer cette partie intéressée ?" onConfirm={() => doDelete(r)}>
            <Tooltip title="Supprimer">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Parties intéressées
          </Typography.Title>
          <Typography.Text type="secondary">{filteredItems.length} élément(s) affiché(s)</Typography.Text>
        </Col>

        <Col flex="none">
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nouvelle
            </Button>
            <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>
              Rafraîchir
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
        <Col flex="auto">
          <Input.Search
            placeholder="Rechercher par nom…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            allowClear
          />
        </Col>

        <Col flex="none">
          <Select
            placeholder="Filtrer par processus"
            style={{ width: 320 }}
            allowClear
            loading={loadingProcesses}
            value={processFilter}
            onChange={(v) => setProcessFilter(v ?? null)}
            options={processes.map((p) => ({
              value: p.id,
              label: formatProcessLabel(p),
            }))}
            showSearch
            optionFilterProp="label"
          />
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredItems}
        loading={loading}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        tableLayout="fixed"
        scroll={{ x: 980 }}
        expandable={{
          expandedRowRender: (r) => {
            const list = (r.processIds || [])
              .map((id) => processById.get(id))
              .filter(Boolean) as ProcessOption[];

            if (!list.length) return <Typography.Text type="secondary">Aucun processus</Typography.Text>;

            return (
              <Space size={[6, 6]} wrap>
                {list.map((p) => (
                  <Tag key={p.id}>{formatProcessLabel(p)}</Tag>
                ))}
              </Space>
            );
          },
          rowExpandable: (r) => (r.processIds || []).length > 0,
        }}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Éditer — ${editing.name}` : "Nouvelle partie intéressée"}
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 12 }}>
            <Form.Item name="name" label="Nom" rules={[{ required: true, message: "Nom requis" }]}>
              <Input placeholder="Ex: ADV, Direction, Client..." />
            </Form.Item>

            <Form.Item name="isActive" label="Actif" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <Form.Item name="processIds" label="Processus rattachés">
            <Select
              mode="multiple"
              placeholder="Sélectionnez un ou plusieurs processus"
              loading={loadingProcesses}
              options={processes.map((p) => ({ value: p.id, label: formatProcessLabel(p) }))}
              showSearch
              optionFilterProp="label"
              allowClear
              maxTagCount="responsive"
            />
          </Form.Item>

          <Divider style={{ margin: "12px 0" }} />

          {/* New fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="needs" label="Besoins (needs)">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="expectations" label="Attentes (expectations)">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="evaluationCriteria" label="Éléments d’évaluation (evaluationCriteria)">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="requirements" label="Exigences (requirements)">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="strengths" label="Forces (strengths)">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="weaknesses" label="Faiblesses (weaknesses)">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="opportunities" label="Opportunités (opportunities)">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item name="risks" label="Risques (risks)">
              <Input.TextArea rows={3} />
            </Form.Item>
          </div>

          <Form.Item name="actionPlan" label="Plan d’actions (actionPlan)">
            <Input.TextArea rows={5} />
          </Form.Item>

          <Space style={{ marginTop: 24 }}>
            <Button type="primary" onClick={saveStakeholder}>
              Enregistrer
            </Button>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}
