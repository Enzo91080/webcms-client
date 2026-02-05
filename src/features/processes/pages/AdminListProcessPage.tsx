import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";

import { LogigrammeEditor } from "../../logigramme/components";
import SipocEditor from "../../sipoc/components/SipocEditor";
import {
  ProcessPreview,
  ObjectivesBlocksEditor,
  PilotsCell,
  getPilotName,
  StakeholderLinksEditor,
  ReferenceDocumentsEditor,
  type StakeholderLinkData,
} from "../components";
import { buildProcessTree } from "../utils/tree";

import {
  adminCreateProcess,
  adminDeleteProcess,
  adminGetProcess,
  adminPatchProcess,
  adminSetProcessPilots,
  adminSetProcessStakeholders,
  type ProcessStakeholderItem,
} from "../../../shared/api";

import {
  ProcessFull,
  ObjectiveBlock,
  StakeholderLinkFields,
  ProcessStakeholder,
} from "../../../shared/types";
import {
  useAdminProcesses,
  usePilotOptions,
  useStakeholderOptions,
} from "../../../shared/hooks";
import {
  getErrorMessage,
  normalizeDocs,
  parseObjectivesToBlocks,
} from "../../../shared/utils";

// ============================================================================
// Component
// ============================================================================

export default function AdminProcessesPage() {
  // ----------------------------
  // Data hooks
  // ----------------------------
  const { items, loading, reload } = useAdminProcesses();
  const { options: pilotOptions } = usePilotOptions();
  const { stakeholders, options: stakeholderOptions, byId: stakeholdersById } = useStakeholderOptions();

  // ----------------------------
  // UI State
  // ----------------------------
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessFull | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  const [stakeholderLinks, setStakeholderLinks] = useState<StakeholderLinkData[]>([]);
  const [q, setQ] = useState("");

  const [form] = Form.useForm();

  // ----------------------------
  // Derived data
  // ----------------------------
  const parentOptions = useMemo(() => {
    const sorted = [...items].sort((a, b) => String(a.code).localeCompare(String(b.code)));
    return [
      { value: "", label: "(Racine)" },
      ...sorted.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((p) => {
      const hay = [
        p.code,
        p.name,
        ...(Array.isArray(p.pilots) ? p.pilots.map((x) => getPilotName(x)) : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [items, q]);

  const treeData = useMemo(() => buildProcessTree(filteredItems), [filteredItems]);

  // ----------------------------
  // Stakeholders selection + editing
  // ----------------------------
  function handleStakeholderSelection(selectedIds: string[]) {
    const currentIds = new Set(stakeholderLinks.map((l) => l.stakeholderId));
    const newIds = new Set(selectedIds);

    const kept = stakeholderLinks.filter((l) => newIds.has(l.stakeholderId));

    const added: StakeholderLinkData[] = selectedIds
      .filter((id) => !currentIds.has(id))
      .map((id) => {
        const s = stakeholdersById.get(id);
        return {
          stakeholderId: id,
          name: s?.name || "?",
          isActive: s?.isActive ?? true,
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

    setStakeholderLinks([...kept, ...added]);
    form.setFieldsValue({ selectedStakeholderIds: selectedIds });
  }

  function updateLinkField(
    stakeholderId: string,
    field: keyof StakeholderLinkFields,
    value: string | null
  ) {
    setStakeholderLinks((prev) =>
      prev.map((l) =>
        l.stakeholderId === stakeholderId ? { ...l, [field]: value?.trim() || null } : l
      )
    );
  }

  // ----------------------------
  // Form mapping (ProcessFull <-> Form)
  // ----------------------------
  function deriveFormFromProcess(proc: ProcessFull) {
    const objectivesBlocks: ObjectiveBlock[] =
      Array.isArray(proc.objectivesBlocks) && proc.objectivesBlocks.length > 0
        ? proc.objectivesBlocks
        : typeof (proc as any).objectives === "string"
          ? parseObjectivesToBlocks((proc as any).objectives)
          : [];

    const pilotIds: string[] = Array.isArray((proc as any).pilotIds)
      ? (proc as any).pilotIds
      : Array.isArray(proc.pilots)
        ? proc.pilots.map((p: any) => p?.id).filter(Boolean)
        : [];

    const selectedStakeholderIds: string[] = Array.isArray((proc as any).stakeholderIds)
      ? (proc as any).stakeholderIds
      : Array.isArray(proc.stakeholders)
        ? proc.stakeholders.map((s: any) => s?.id).filter(Boolean)
        : [];

    const links: StakeholderLinkData[] = Array.isArray(proc.stakeholders)
      ? proc.stakeholders.map((s: ProcessStakeholder) => ({
          stakeholderId: s.id,
          name: s.name,
          isActive: s.isActive,
          needs: s.link?.needs ?? null,
          expectations: s.link?.expectations ?? null,
          evaluationCriteria: s.link?.evaluationCriteria ?? null,
          requirements: s.link?.requirements ?? null,
          strengths: s.link?.strengths ?? null,
          weaknesses: s.link?.weaknesses ?? null,
          opportunities: s.link?.opportunities ?? null,
          risks: s.link?.risks ?? null,
          actionPlan: s.link?.actionPlan ?? null,
        }))
      : [];

    return {
      formValues: {
        code: proc.code || "",
        name: proc.name || "",
        parentProcessId: proc.parentProcessId || "",
        orderInParent: proc.orderInParent ?? 1,
        isActive: Boolean(proc.isActive ?? true),
        title: (proc as any).title || "",
        objectivesBlocks,
        pilotIds,
        selectedStakeholderIds,
        referenceDocuments: normalizeDocs((proc as any).referenceDocuments),
      },
      stakeholderLinks: links,
    };
  }

  // ----------------------------
  // Drawer open / edit / create
  // ----------------------------
  function openCreate() {
    setEditing(null);
    setActiveTab("general");
    setStakeholderLinks([]);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      code: "",
      name: "",
      parentProcessId: "",
      orderInParent: 1,
      isActive: true,
      title: "",
      objectivesBlocks: [],
      selectedStakeholderIds: [],
      pilotIds: [],
      referenceDocuments: [],
    });
  }

  async function openEdit(p: ProcessFull) {
    setEditing(p);
    setActiveTab("general");
    setOpen(true);

    const lite = deriveFormFromProcess(p);
    setStakeholderLinks(lite.stakeholderLinks);

    form.resetFields();
    form.setFieldsValue(lite.formValues);

    try {
      const full = await adminGetProcess(p.id);
      const proc = full.data as ProcessFull;
      setEditing(proc);

      const hydrated = deriveFormFromProcess(proc);
      setStakeholderLinks(hydrated.stakeholderLinks);
      form.setFieldsValue(hydrated.formValues);
    } catch (e) {
      console.warn(e);
    }
  }

  // ----------------------------
  // Save / Delete
  // ----------------------------
  async function saveBase() {
    try {
      const v = await form.validateFields();

      const payload = {
        code: String(v.code).trim(),
        name: String(v.name).trim(),
        parentProcessId: v.parentProcessId ? String(v.parentProcessId) : null,
        orderInParent: Number(v.orderInParent || 1),
        isActive: Boolean(v.isActive),
        title: String(v.title || ""),
        objectivesBlocks: Array.isArray(v.objectivesBlocks) ? v.objectivesBlocks : [],
        referenceDocuments: Array.isArray(v.referenceDocuments) ? v.referenceDocuments : [],
      };

      const pilotIds: string[] = Array.isArray(v.pilotIds) ? v.pilotIds : [];

      const stakeholderItems: ProcessStakeholderItem[] = stakeholderLinks.map((link) => ({
        stakeholderId: link.stakeholderId,
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

      if (!payload.code || !payload.name) throw new Error("code et name sont obligatoires");

      // CREATE
      if (!editing?.id) {
        const createRes = await adminCreateProcess(payload);
        const createdId = createRes.data?.id;

        if (createdId) {
          await adminSetProcessPilots(createdId, pilotIds);
          await adminSetProcessStakeholders(createdId, stakeholderItems);
        }

        message.success("Processus créé");
        setOpen(false);
        await reload();
        return;
      }

      // UPDATE
      await adminPatchProcess(editing.id, payload);
      await adminSetProcessPilots(editing.id, pilotIds);
      await adminSetProcessStakeholders(editing.id, stakeholderItems);

      message.success("Processus enregistré");
      await reload();

      try {
        const full = await adminGetProcess(editing.id);
        setEditing(full.data as ProcessFull);
      } catch {
        // silent
      }
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  async function doDelete(p: ProcessFull) {
    try {
      await adminDeleteProcess(p.id);
      message.success("Supprimé");
      if (editing?.id === p.id) setOpen(false);
      await reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  // ----------------------------
  // Table columns
  // ----------------------------
  const columns: ColumnsType<ProcessFull> = [
    { title: "Code", dataIndex: "code", key: "code", width: 120 },
    { title: "Nom", dataIndex: "name", key: "name" },
    {
      title: "Parent",
      key: "parent",
      width: 140,
      render: (_: any, r: ProcessFull) => {
        if (!r.parentProcessId) return <Tag color="blue">Racine</Tag>;
        const parent = items.find((x) => x.id === r.parentProcessId);
        return <span>{parent?.code || "?"}</span>;
      },
    },
    {
      title: "Pilotes",
      key: "pilots",
      width: 220,
      render: (_: any, r: ProcessFull) => <PilotsCell pilots={r.pilots as any} />,
    },
    { title: "Ordre", dataIndex: "orderInParent", key: "orderInParent", width: 90 },
    {
      title: "Actif",
      key: "isActive",
      width: 100,
      render: (_: any, r: ProcessFull) => (
        <Tag color={r.isActive ? "green" : "default"}>{r.isActive ? "Oui" : "Non"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_: any, r: ProcessFull) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>
            Éditer
          </Button>
          <Popconfirm title="Supprimer ce processus ?" onConfirm={() => doDelete(r)}>
            <Button size="small" danger>
              Supprimer
            </Button>
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
            Processus
          </Typography.Title>
          <Typography.Text type="secondary">
            {filteredItems.length} élément(s) affiché(s)
          </Typography.Text>
        </Col>

        <Col flex="none">
          <Space wrap>
            <Input
              allowClear
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (code, nom, pilote...)"
              style={{ width: 340 }}
            />

            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nouvelle
            </Button>

            <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>
              Rafraîchir
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={treeData}
        loading={loading}
        pagination={{ pageSize: 12 }}
        expandable={{
          expandRowByClick: true,
          childrenColumnName: "children",
          indentSize: 18,
        }}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Admin — ${editing.code} ${editing.name}` : "Admin — Nouveau processus"}
        width={1400}
        destroyOnClose
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "general",
              label: "Général",
              children: (
                <Form form={form} layout="vertical">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr 1fr 140px 120px",
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    <Form.Item
                      name="code"
                      label="Code"
                      rules={[{ required: true, message: "Code requis" }]}
                    >
                      <Input placeholder="P02 / SP0201 ..." />
                    </Form.Item>

                    <Form.Item
                      name="name"
                      label="Nom"
                      rules={[{ required: true, message: "Nom requis" }]}
                    >
                      <Input placeholder="Vendre / Prospecter ..." />
                    </Form.Item>

                    <Form.Item name="parentProcessId" label="Parent">
                      <Select options={parentOptions} />
                    </Form.Item>

                    <Form.Item name="orderInParent" label="Ordre">
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item name="isActive" label="Actif" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </div>

                  <Form.Item name="title" label="Objet du processus">
                    <Input.TextArea rows={3} />
                  </Form.Item>

                  <Form.Item name="objectivesBlocks" label="Objectifs">
                    <ObjectivesBlocksEditor />
                  </Form.Item>

                  <Form.Item name="pilotIds" label="Pilote(s)">
                    <Select
                      mode="multiple"
                      options={pilotOptions}
                      placeholder="Sélectionner le(s) pilote(s)..."
                      filterOption={(input, option) =>
                        String(option?.label || "").toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>

                  <Form.Item name="selectedStakeholderIds" label="Parties intéressées">
                    <Select
                      mode="multiple"
                      options={stakeholderOptions}
                      placeholder="Sélectionner les parties intéressées..."
                      filterOption={(input, option) =>
                        String(option?.label || "").toLowerCase().includes(input.toLowerCase())
                      }
                      onChange={handleStakeholderSelection}
                    />
                  </Form.Item>

                  <StakeholderLinksEditor links={stakeholderLinks} onUpdateField={updateLinkField} />

                  <ReferenceDocumentsEditor />

                  <Space style={{ marginTop: 24 }}>
                    <Button type="primary" onClick={saveBase}>
                      Enregistrer
                    </Button>
                  </Space>
                </Form>
              ),
            },
            {
              key: "sipoc",
              label: "SIPOC",
              children: editing?.id ? (
                <SipocEditor
                  processId={editing.id}
                  processName={`${editing.code} - ${editing.name}`}
                  onSaved={async () => {
                    try {
                      const full = await adminGetProcess(editing.id);
                      setEditing(full.data as ProcessFull);
                    } catch {
                      // Ignore - already saved
                    }
                  }}
                />
              ) : (
                <div style={{ opacity: 0.7 }}>Crée d'abord le processus puis édite le SIPOC.</div>
              ),
            },
            {
              key: "logigramme",
              label: "Logigramme",
              children: editing?.id ? (
                <LogigrammeEditor
                  processId={editing.id}
                  sipocRows={editing?.sipoc?.rows || []}
                  initial={editing?.logigramme}
                  onSaved={async (logi) => {
                    try {
                      const full = await adminGetProcess(editing.id);
                      setEditing(full.data as ProcessFull);
                    } catch {
                      setEditing((prev: any) => ({ ...(prev || {}), logigramme: logi }));
                    }
                  }}
                />
              ) : (
                <div style={{ opacity: 0.7 }}>Crée d'abord le processus puis édite le logigramme.</div>
              ),
            },
            {
              key: "preview",
              label: "Aperçu",
              children: editing?.id ? (
                <ProcessPreview data={editing as any} />
              ) : (
                <div style={{ opacity: 0.7 }}>Crée d'abord le processus pour voir l'aperçu.</div>
              ),
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
