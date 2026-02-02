import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import LogigrammeEditor from "../../logigramme/LogigrammeEditor";
import ProcessPreview from "../../ProcessPreview";
import SipocEditor from "../../sipoc/SipocEditor";
import {
  adminCreateProcess,
  adminDeleteProcess,
  adminGetProcess,
  adminListProcesses,
  adminListStakeholders,
  adminPatchProcess,
  type Stakeholder,
} from "../../../api";
import { ProcessFull } from "../../../types";



function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return String(e);
}

function normalizeDocs(input: any) {
  if (!Array.isArray(input)) return [];
  return input.map((d) => ({
    code: String(d?.code || ""),
    title: String(d?.title || ""),
    type: String(d?.type || ""),
    url: String(d?.url || ""),
  }));
}

function buildTree(items: ProcessFull[]) {
  const nodes = items.map((p) => ({ ...p, children: [] as ProcessFull[] }));
  const byId = new Map<string, ProcessFull>();
  nodes.forEach((n) => byId.set(n.id, n));

  const roots: ProcessFull[] = [];
  for (const n of nodes) {
    const pid = n.parentProcessId || null;
    const parent = pid ? byId.get(pid) : null;
    if (parent) parent.children!.push(n);
    else roots.push(n);
  }

  const sortRec = (arr: ProcessFull[]) => {
    arr.sort((a, b) => {
      const oa = a.orderInParent ?? 9999;
      const ob = b.orderInParent ?? 9999;
      if (oa !== ob) return oa - ob;
      return String(a.code).localeCompare(String(b.code));
    });
    arr.forEach((x) => x.children && x.children.length && sortRec(x.children));
  };

  const pruneEmptyChildren = (n: ProcessFull) => {
    if (!n.children || n.children.length === 0) {
      delete (n as any).children;
      return;
    }
    n.children.forEach(pruneEmptyChildren);
  };

  sortRec(roots);
  roots.forEach(pruneEmptyChildren);

  return roots;
}

export default function AdminProcessesPage() {
  const [items, setItems] = useState<ProcessFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessFull | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  const [form] = Form.useForm();

  async function reload() {
    try {
      setLoading(true);
      const res = await adminListProcesses();
      setItems((res.data || []) as ProcessFull[]);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadStakeholders() {
    try {
      const res = await adminListStakeholders();
      setStakeholders((res.data || []).filter((s) => s.isActive));
    } catch (e) {
      console.warn("Failed to load stakeholders", e);
    }
  }

  useEffect(() => {
    reload();
    loadStakeholders();
  }, []);

  const treeData = useMemo(() => buildTree(items), [items]);

  const parentOptions = useMemo(() => {
    const sorted = [...items].sort((a, b) => String(a.code).localeCompare(String(b.code)));
    return [
      { value: "", label: "(Racine)" },
      ...sorted.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    ];
  }, [items]);

  const stakeholderOptions = useMemo(() => {
    return stakeholders.map((s) => ({ value: s.name, label: s.name }));
  }, [stakeholders]);

  function openCreate() {
    setEditing(null);
    setActiveTab("general");
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      code: "",
      name: "",
      parentProcessId: "",
      orderInParent: 1,
      isActive: true,
      title: "",
      objectives: "",
      stakeholders: [],
      referenceDocuments: [],
    });
  }

  async function openEdit(p: ProcessFull) {
    setEditing(p); // optimistic: show drawer immediately
    setActiveTab("general");
    setOpen(true);

    // populate from lite first
    form.resetFields();
    form.setFieldsValue({
      code: p.code || "",
      name: p.name || "",
      parentProcessId: p.parentProcessId || "",
      orderInParent: p.orderInParent ?? 1,
      isActive: Boolean(p.isActive ?? true),
      title: p.title || "",
      objectives: p.objectives || "",
      stakeholders: Array.isArray(p.stakeholders) ? p.stakeholders : [],
      referenceDocuments: normalizeDocs(p.referenceDocuments),
    });

    // then fetch full doc (sipoc/logigramme)
    try {
      const full = await adminGetProcess(p.id);
      const proc = full.data as ProcessFull;
      setEditing(proc);
      form.setFieldsValue({
        code: proc.code || "",
        name: proc.name || "",
        parentProcessId: proc.parentProcessId || "",
        orderInParent: proc.orderInParent ?? 1,
        isActive: Boolean(proc.isActive ?? true),
        title: proc.title || "",
        objectives: proc.objectives || "",
        stakeholders: Array.isArray(proc.stakeholders) ? proc.stakeholders : [],
        referenceDocuments: normalizeDocs(proc.referenceDocuments),
      });
    } catch (e) {
      console.warn(e);
    }
  }

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
        objectives: String(v.objectives || ""),
        stakeholders: Array.isArray(v.stakeholders) ? v.stakeholders : [],
        referenceDocuments: Array.isArray(v.referenceDocuments) ? v.referenceDocuments : [],
      };

      if (!payload.code || !payload.name) throw new Error("code et name sont obligatoires");

      if (!editing?.id) {
        await adminCreateProcess(payload);
        message.success("Processus créé");
        setOpen(false);
        await reload();
        return;
      }

      await adminPatchProcess(editing.id, payload);
      message.success("Processus enregistré");
      await reload();

      // refresh editing with full doc
      try {
        const full = await adminGetProcess(editing.id);
        setEditing(full.data as ProcessFull);
      } catch { }
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

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={openCreate}>
          + Nouveau processus
        </Button>
        <Button onClick={reload} loading={loading}>
          Rafraîchir
        </Button>
      </Space>

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
        width={1200}
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
                  {/* Header fields - Identité du processus */}
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 140px 120px", gap: 12, marginBottom: 24 }}>
                    <Form.Item name="code" label="Code" rules={[{ required: true, message: "Code requis" }]}>
                      <Input placeholder="P02 / SP0201 ..." />
                    </Form.Item>

                    <Form.Item name="name" label="Nom" rules={[{ required: true, message: "Nom requis" }]}>
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

                  {/* Description and metadata fields */}
                  <Form.Item name="title" label="Objet du processus">
                    <Input.TextArea rows={3} />
                  </Form.Item>

                  <Form.Item name="objectives" label="Objectifs (Markdown)">
                    <Input.TextArea rows={8} placeholder={"- Objectif 1\n- Objectif 2\n"} />
                  </Form.Item>

                  <Form.Item name="stakeholders" label="Parties intéressées">
                    <Select
                      mode="multiple"
                      options={stakeholderOptions}
                      placeholder="Sélectionner les parties intéressées..."
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>

                  {/* Reference documents */}
                  <Form.List name="referenceDocuments">
                    {(fields, { add, remove }) => (
                      <div>
                        <Space style={{ marginBottom: 12 }}>
                          <Button onClick={() => add({ code: "", title: "", type: "PDF", url: "" })}>
                            + Ajouter un document
                          </Button>
                        </Space>

                        {fields.map((f) => (
                          <div
                            key={f.key}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "140px 1fr 120px 1fr 90px",
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <Form.Item name={[f.name, "code"]} style={{ marginBottom: 0 }}>
                              <Input placeholder="DOC-XXX-001" />
                            </Form.Item>
                            <Form.Item name={[f.name, "title"]} style={{ marginBottom: 0 }}>
                              <Input placeholder="Titre document" />
                            </Form.Item>
                            <Form.Item name={[f.name, "type"]} style={{ marginBottom: 0 }}>
                              <Input placeholder="PDF" />
                            </Form.Item>
                            <Form.Item name={[f.name, "url"]} style={{ marginBottom: 0 }}>
                              <Input placeholder="https://... ou /process/..." />
                            </Form.Item>
                            <Button danger onClick={() => remove(f.name)}>
                              Suppr.
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.List>

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
                  initialRows={editing?.sipoc?.rows || []}
                  onSaved={async (rows) => {
                    try {
                      const full = await adminGetProcess(editing.id);
                      setEditing(full.data as ProcessFull);
                    } catch {
                      setEditing((prev: any) => ({ ...(prev || {}), sipoc: { rows } }));
                    }
                  }}
                />
              ) : (
                <div style={{ opacity: 0.7 }}>Crée d’abord le processus puis édite le SIPOC.</div>
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
                <div style={{ opacity: 0.7 }}>Crée d’abord le processus puis édite le logigramme.</div>
              ),
            },

            // ✅ Preview tab restored
            {
              key: "preview",
              label: "Aperçu",
              children: editing?.id ? (
                <ProcessPreview data={editing as any} />
              ) : (
                <div style={{ opacity: 0.7 }}>Crée d’abord le processus pour voir l’aperçu.</div>
              ),
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
