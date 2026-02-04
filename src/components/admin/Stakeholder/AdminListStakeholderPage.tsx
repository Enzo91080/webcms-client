import {
  Button,
  Collapse,
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
  type ProcessWithLink,
  type StakeholderProcessItem,
} from "../../../api";
import type { StakeholderLinkFields } from "../../../types";

type ProcessOption = {
  id: string;
  code: string;
  name: string;
};

// Type pour les données de processus avec les champs de lien dans le form
type ProcessLinkData = {
  processId: string;
  code: string;
  name: string;
} & StakeholderLinkFields;

type StakeholderWithProcesses = Stakeholder & {
  processIds?: string[];
  processes?: ProcessWithLink[];
};

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return String(e);
}

function formatProcessLabel(p: ProcessOption) {
  return `${p.code} — ${p.name}`;
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

  // Process du stakeholder avec leurs champs de lien
  const [processLinks, setProcessLinks] = useState<ProcessLinkData[]>([]);

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

  // Gestion de la sélection des process (ajoute/retire des links)
  function handleProcessSelection(selectedIds: string[]) {
    const currentIds = new Set(processLinks.map((l) => l.processId));
    const newIds = new Set(selectedIds);

    // Garder les liens existants pour les IDs toujours sélectionnés
    const kept = processLinks.filter((l) => newIds.has(l.processId));

    // Ajouter de nouveaux liens vides pour les nouveaux IDs
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

  // Mise à jour d'un champ de lien pour un processus
  function updateLinkField(processId: string, field: keyof StakeholderLinkFields, value: string | null) {
    setProcessLinks((prev) =>
      prev.map((l) =>
        l.processId === processId
          ? { ...l, [field]: value?.trim() || null }
          : l
      )
    );
  }

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

    // Convertir les processes avec leurs champs de lien
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

  async function saveStakeholder() {
    try {
      const v = await form.validateFields();

      const name = String(v.name || "").trim();
      const isActive = Boolean(v.isActive);

      if (!name) throw new Error("Le nom est obligatoire");

      // Préparer les process avec leurs champs de lien
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

      const detailsPayload = {
        name,
        isActive,
      };

      if (!editing?.id) {
        const createRes: any = await adminCreateStakeholder(detailsPayload);
        const createdId: string | undefined =
          createRes?.data?.id || createRes?.data?.stakeholder?.id;

        if (createdId) {
          await adminSetStakeholderProcesses(createdId, processItems);
          message.success("Partie intéressée créée");
          setOpen(false);
          await reload();
          return;
        }

        // fallback si le back ne renvoie pas l'id
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
            const list = (r.processes || []);

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
              options={processes.map((p) => ({ value: p.id, label: formatProcessLabel(p) }))}
              showSearch
              optionFilterProp="label"
              allowClear
              maxTagCount="responsive"
              onChange={handleProcessSelection}
            />
          </Form.Item>

          {processLinks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                Détails par processus
              </Typography.Text>
              <Collapse
                accordion
                items={processLinks.map((link) => ({
                  key: link.processId,
                  label: `${link.code} — ${link.name}`,
                  children: (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Besoins</Typography.Text>
                        <Input.TextArea
                          rows={2}
                          value={link.needs ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "needs", e.target.value)}
                          placeholder="Besoins pour ce processus..."
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Attentes</Typography.Text>
                        <Input.TextArea
                          rows={2}
                          value={link.expectations ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "expectations", e.target.value)}
                          placeholder="Attentes..."
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Éléments d'évaluation</Typography.Text>
                        <Input.TextArea
                          rows={2}
                          value={link.evaluationCriteria ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "evaluationCriteria", e.target.value)}
                          placeholder="Critères d'évaluation..."
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Exigences</Typography.Text>
                        <Input.TextArea
                          rows={2}
                          value={link.requirements ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "requirements", e.target.value)}
                          placeholder="Exigences..."
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Forces</Typography.Text>
                        <Input.TextArea
                          rows={2}
                          value={link.strengths ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "strengths", e.target.value)}
                          placeholder="Forces..."
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Faiblesses</Typography.Text>
                        <Input.TextArea
                          rows={2}
                          value={link.weaknesses ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "weaknesses", e.target.value)}
                          placeholder="Faiblesses..."
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Opportunités</Typography.Text>
                        <Input.TextArea
                          rows={2}
                          value={link.opportunities ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "opportunities", e.target.value)}
                          placeholder="Opportunités..."
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Risques</Typography.Text>
                        <Input.TextArea
                          rows={2}
                          value={link.risks ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "risks", e.target.value)}
                          placeholder="Risques..."
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Plan d'actions</Typography.Text>
                        <Input.TextArea
                          rows={3}
                          value={link.actionPlan ?? ""}
                          onChange={(e) => updateLinkField(link.processId, "actionPlan", e.target.value)}
                          placeholder="Plan d'actions..."
                        />
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          )}

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
