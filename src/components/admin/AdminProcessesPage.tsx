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
import LogigrammeEditor from "../../components/logigramme/LogigrammeEditor";
import ProcessPreview from "../../components/ProcessPreview"; // ✅ added
import SipocEditor from "../../components/SipocEditor";
import {
  adminCreateProcess,
  adminDeleteProcess,
  adminGetProcess,
  adminListProcesses,
  adminPatchProcess,
} from "../../lib/api";

type Proc = {
  id: string;
  code: string;
  name: string;
  parentProcessId?: string | null;
  orderInParent?: number;
  isActive?: boolean;

  title?: string;
  objectives?: string;
  stakeholders?: any[];
  referenceDocuments?: any[];
  sipoc?: any;
  logigramme?: any;

  children?: Proc[];
};

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

function buildTree(items: Proc[]) {
  const nodes = items.map((p) => ({ ...p, children: [] as Proc[] }));
  const byId = new Map<string, Proc>();
  nodes.forEach((n) => byId.set(n.id, n));

  const roots: Proc[] = [];
  for (const n of nodes) {
    const pid = n.parentProcessId || null;
    const parent = pid ? byId.get(pid) : null;
    if (parent) parent.children!.push(n);
    else roots.push(n);
  }

  const sortRec = (arr: Proc[]) => {
    arr.sort((a, b) => {
      const oa = a.orderInParent ?? 9999;
      const ob = b.orderInParent ?? 9999;
      if (oa !== ob) return oa - ob;
      return String(a.code).localeCompare(String(b.code));
    });
    arr.forEach((x) => x.children && x.children.length && sortRec(x.children));
  };

  const pruneEmptyChildren = (n: Proc) => {
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
  const [items, setItems] = useState<Proc[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proc | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  const [form] = Form.useForm();

  async function reload() {
    try {
      setLoading(true);
      const res = await adminListProcesses();
      setItems((res.data || []) as Proc[]);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const treeData = useMemo(() => buildTree(items), [items]);

  const parentOptions = useMemo(() => {
    const sorted = [...items].sort((a, b) => String(a.code).localeCompare(String(b.code)));
    return [
      { value: "", label: "(Racine)" },
      ...sorted.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    ];
  }, [items]);

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

  async function openEdit(p: Proc) {
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
      const proc = full.data as Proc;
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
        setEditing(full.data as Proc);
      } catch { }
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  async function doDelete(p: Proc) {
    try {
      await adminDeleteProcess(p.id);
      message.success("Supprimé");
      if (editing?.id === p.id) setOpen(false);
      await reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  const columns: ColumnsType<Proc> = [
    { title: "Code", dataIndex: "code", key: "code", width: 120 },
    { title: "Nom", dataIndex: "name", key: "name" },
    {
      title: "Parent",
      key: "parent",
      width: 140,
      render: (_: any, r: Proc) => {
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
      render: (_: any, r: Proc) => (
        <Tag color={r.isActive ? "green" : "default"}>{r.isActive ? "Oui" : "Non"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_: any, r: Proc) => (
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
                  <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 140px 120px", gap: 12 }}>
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

                  <Space>
                    <Button type="primary" onClick={saveBase}>
                      Enregistrer
                    </Button>
                  </Space>
                </Form>
              ),
            },
            {
              key: "fiche",
              label: "Fiche",
              children: (
                <Form form={form} layout="vertical">
                  <Form.Item name="title" label="Objet du processus">
                    <Input.TextArea rows={3} />
                  </Form.Item>

                  <Form.Item name="objectives" label="Objectives (Markdown)">
                    <Input.TextArea rows={10} placeholder={"- Objectif 1\n- Objectif 2\n"} />
                  </Form.Item>

                  <Form.Item name="stakeholders" label="Parties intéressées">
                    <Select mode="tags" placeholder="Commercial, ADV..." />
                  </Form.Item>

                  <Form.List name="referenceDocuments">
                    {(fields, { add, remove }) => (
                      <div>
                        <Space style={{ marginBottom: 8 }}>
                          <Button onClick={() => add({ code: "", title: "", type: "PDF", url: "" })}>
                            + Ajouter un doc
                          </Button>
                          <Button type="primary" onClick={saveBase}>
                            Enregistrer
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
                      setEditing(full.data as Proc);
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
                      setEditing(full.data as Proc);
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
