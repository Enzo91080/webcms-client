import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";

import { ProcessLinksEditor, type ProcessLinkData } from "../components";

import {
  adminCreateStakeholder,
  adminDeleteStakeholder,
  adminPatchStakeholder,
  adminSetStakeholderProcesses,
  type Stakeholder,
  type ProcessWithLink,
  type StakeholderProcessItem,
} from "../../../shared/api";
import type { StakeholderLinkFields } from "../../../shared/types";
import { useAdminStakeholders, useProcessOptions } from "../../../shared/hooks";
import { getErrorMessage, formatProcessLabel } from "../../../shared/utils";

type StakeholderWithProcesses = Stakeholder & {
  processIds?: string[];
  processes?: ProcessWithLink[];
};

export default function AdminStakeholdersPage() {
  // Data hooks
  const { items, loading, reload } = useAdminStakeholders();
  const { options: processOptions, byId: processById, loading: loadingProcesses } = useProcessOptions();

  // UI state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StakeholderWithProcesses | null>(null);
  const [form] = Form.useForm();

  const [processLinks, setProcessLinks] = useState<ProcessLinkData[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [processFilter, setProcessFilter] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return (items || []).filter((s) => {
      const okName = !qq || String(s.name || "").toLowerCase().includes(qq);
      const okProcess = !processFilter || ((s as StakeholderWithProcesses).processIds || []).includes(processFilter);
      return okName && okProcess;
    });
  }, [items, q, processFilter]);

  // ----------------------------
  // Process selection & link editing
  // ----------------------------
  function handleProcessSelection(selectedIds: string[]) {
    const currentIds = new Set(processLinks.map((l) => l.processId));
    const newIds = new Set(selectedIds);

    const kept = processLinks.filter((l) => newIds.has(l.processId));

    const added: ProcessLinkData[] = selectedIds
      .filter((id) => !currentIds.has(id))
      .map((id) => {
        const p = processById.get(id);
        return {
          processId: id,
          code: p?.code || "?",
          name: p?.name || "?",
          needs: null,
          expectations: null,
          evaluationCriteria: null,
          requirements: null,
          strengths: null,
          weaknesses: null,
          opportunities: null,
          risks: null,
          actionPlan: null,
        };
      });

    setProcessLinks([...kept, ...added]);
    form.setFieldsValue({ selectedProcessIds: selectedIds });
  }

  function updateLinkField(processId: string, field: keyof StakeholderLinkFields, value: string | null) {
    // Don't trim during editing - preserve spaces and newlines as typed
    setProcessLinks((prev) =>
      prev.map((l) => (l.processId === processId ? { ...l, [field]: value || null } : l))
    );
  }

  // ----------------------------
  // Drawer open / edit / create
  // ----------------------------
  function openCreate() {
    setEditing(null);
    setProcessLinks([]);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      name: "",
      isActive: true,
      selectedProcessIds: [],
    });
  }

  function openEdit(s: StakeholderWithProcesses) {
    setEditing(s);
    setOpen(true);

    const links: ProcessLinkData[] = (s.processes || []).map((p) => ({
      processId: p.id,
      code: p.code,
      name: p.name,
      needs: p.link?.needs ?? null,
      expectations: p.link?.expectations ?? null,
      evaluationCriteria: p.link?.evaluationCriteria ?? null,
      requirements: p.link?.requirements ?? null,
      strengths: p.link?.strengths ?? null,
      weaknesses: p.link?.weaknesses ?? null,
      opportunities: p.link?.opportunities ?? null,
      risks: p.link?.risks ?? null,
      actionPlan: p.link?.actionPlan ?? null,
    }));

    setProcessLinks(links);

    form.resetFields();
    form.setFieldsValue({
      name: s.name || "",
      isActive: Boolean(s.isActive ?? true),
      selectedProcessIds: s.processIds || [],
    });
  }

  // ----------------------------
  // Save / Delete
  // ----------------------------
  async function saveStakeholder() {
    try {
      const v = await form.validateFields();

      const name = String(v.name || "").trim();
      const isActive = Boolean(v.isActive);

      if (!name) throw new Error("Le nom est obligatoire");

      const processItems: StakeholderProcessItem[] = processLinks.map((link) => ({
        processId: link.processId,
        needs: link.needs,
        expectations: link.expectations,
        evaluationCriteria: link.evaluationCriteria,
        requirements: link.requirements,
        strengths: link.strengths,
        weaknesses: link.weaknesses,
        opportunities: link.opportunities,
        risks: link.risks,
        actionPlan: link.actionPlan,
      }));

      const detailsPayload = { name, isActive };

      if (!editing?.id) {
        const createRes: any = await adminCreateStakeholder(detailsPayload);
        const createdId: string | undefined = createRes?.data?.id || createRes?.data?.stakeholder?.id;

        if (createdId) {
          await adminSetStakeholderProcesses(createdId, processItems);
          message.success("Partie intéressée créée");
          setOpen(false);
          await reload();
          return;
        }

        await reload();
        const found = items.find((s) => String(s.name || "").trim() === name);
        if (found?.id) await adminSetStakeholderProcesses(found.id, processItems);

        message.success("Partie intéressée créée");
        setOpen(false);
        await reload();
        return;
      }

      await adminPatchStakeholder(editing.id, detailsPayload);
      await adminSetStakeholderProcesses(editing.id, processItems);

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

  // ----------------------------
  // Table columns
  // ----------------------------
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

  // ----------------------------
  // Render
  // ----------------------------
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
            options={processOptions}
            showSearch
            optionFilterProp="label"
          />
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredItems as StakeholderWithProcesses[]}
        loading={loading}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        tableLayout="fixed"
        scroll={{ x: 980 }}
        expandable={{
          expandedRowRender: (r) => {
            const list = r.processes || [];

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
        width={900}
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

          <Form.Item name="selectedProcessIds" label="Processus rattachés">
            <Select
              mode="multiple"
              placeholder="Sélectionnez un ou plusieurs processus"
              loading={loadingProcesses}
              options={processOptions}
              showSearch
              optionFilterProp="label"
              allowClear
              maxTagCount="responsive"
              onChange={handleProcessSelection}
            />
          </Form.Item>

          <ProcessLinksEditor links={processLinks} onUpdateField={updateLinkField} />

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
