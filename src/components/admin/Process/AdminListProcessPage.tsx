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
import { LogigrammeEditor } from "../../logigramme";
import ProcessPreview from "../../ProcessPreview";
import SipocEditor from "../../sipoc/SipocEditor";
import ObjectivesBlocksEditor from "./ObjectivesBlocksEditor";
import {
  adminCreateProcess,
  adminDeleteProcess,
  adminGetProcess,
  adminListProcesses,
  adminListStakeholders,
  adminListPilots,
  adminPatchProcess,
  adminSetProcessPilots,
  type Stakeholder,
  type Pilot,
} from "../../../api";
import { ProcessFull, ObjectiveBlock } from "../../../types";



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

/**
 * Parse un string objectives (ancien format) en ObjectiveBlock[]
 * Détecte automatiquement :
 * - Lignes numérotées (1., 2., etc.) → bloc numbered ou text si suivi de sous-éléments
 * - Lignes indentées ou sans numéro après une numérotée → bullets (sous-liste)
 * - Lignes simples → text
 */
function parseObjectivesToBlocks(input: string): ObjectiveBlock[] {
  if (!input || typeof input !== "string") return [];

  const lines = input.split(/\r?\n/);
  const blocks: ObjectiveBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Détecte une ligne numérotée : "1.", "1. ", "1.  Texte", etc.
    const numberedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);

    if (numberedMatch) {
      const mainText = numberedMatch[2].trim();

      // Regarde les lignes suivantes pour détecter des sous-éléments
      const subItems: string[] = [];
      let j = i + 1;

      while (j < lines.length) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();

        // Ligne vide = fin du groupe
        if (!nextTrimmed) break;

        // Si c'est une nouvelle ligne numérotée, on arrête
        if (/^\d+\.\s*/.test(nextTrimmed)) break;

        // Sinon c'est un sous-élément (indenté ou bullet)
        // Nettoie les éventuels tirets/puces en début
        const cleaned = nextTrimmed.replace(/^[-•]\s*/, "").trim();
        if (cleaned) {
          subItems.push(cleaned);
        }
        j++;
      }

      if (subItems.length > 0) {
        // On a des sous-éléments : créer un bloc text pour le titre + bloc bullets
        if (mainText) {
          blocks.push({ type: "text", text: mainText });
        }
        blocks.push({ type: "bullets", items: subItems });
      } else {
        // Pas de sous-éléments : on accumule les lignes numérotées en un seul bloc numbered
        const numberedItems: string[] = [];
        if (mainText) numberedItems.push(mainText);

        // Continue à collecter les lignes numérotées consécutives sans sous-éléments
        let k = j;
        while (k < lines.length) {
          const nextLine = lines[k];
          const nextTrimmed = nextLine.trim();

          if (!nextTrimmed) {
            k++;
            continue;
          }

          const nextNumbered = nextTrimmed.match(/^(\d+)\.\s*(.*)/);
          if (!nextNumbered) break;

          // Vérifie si cette ligne numérotée a des sous-éléments
          let hasSubItems = false;
          let m = k + 1;
          while (m < lines.length) {
            const checkLine = lines[m].trim();
            if (!checkLine) break;
            if (/^\d+\.\s*/.test(checkLine)) break;
            hasSubItems = true;
            break;
          }

          if (hasSubItems) break;

          const itemText = nextNumbered[2].trim();
          if (itemText) numberedItems.push(itemText);
          k++;
        }

        if (numberedItems.length > 0) {
          blocks.push({ type: "numbered", items: numberedItems });
        }
        i = k;
        continue;
      }

      i = j;
      continue;
    }

    // Ligne simple (ni numérotée, ni sous-élément) → bloc text
    // Ou ligne avec tiret/puce isolée
    const cleanedLine = trimmed.replace(/^[-•]\s*/, "").trim();
    if (cleanedLine) {
      blocks.push({ type: "text", text: cleanedLine });
    }
    i++;
  }

  return blocks;
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
  const [pilots, setPilots] = useState<Pilot[]>([]);

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

  async function loadPilots() {
    try {
      const res = await adminListPilots();
      setPilots((res.data || []).filter((p) => p.isActive));
    } catch (e) {
      console.warn("Failed to load pilots", e);
    }
  }

  useEffect(() => {
    reload();
    loadStakeholders();
    loadPilots();
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

  const pilotOptions = useMemo(() => {
    return pilots.map((p) => ({ value: p.id, label: p.name }));
  }, [pilots]);

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
      objectivesBlocks: [],
      stakeholders: [],
      pilotIds: [],
      referenceDocuments: [],
    });
  }

  async function openEdit(p: ProcessFull) {
    setEditing(p); // optimistic: show drawer immediately
    setActiveTab("general");
    setOpen(true);

    // Détermine les objectivesBlocks : utilise les existants ou parse l'ancien string
    const getObjectivesBlocks = (proc: ProcessFull): ObjectiveBlock[] => {
      if (Array.isArray(proc.objectivesBlocks) && proc.objectivesBlocks.length > 0) {
        return proc.objectivesBlocks;
      }
      // Fallback : parse l'ancien format string
      if (proc.objectives && typeof proc.objectives === "string") {
        return parseObjectivesToBlocks(proc.objectives);
      }
      return [];
    };

    // Helper to extract pilotIds from process
    const getPilotIds = (proc: ProcessFull): string[] => {
      if (Array.isArray(proc.pilotIds)) return proc.pilotIds;
      if (Array.isArray(proc.pilots)) return proc.pilots.map((p) => p.id);
      return [];
    };

    // populate from lite first
    form.resetFields();
    form.setFieldsValue({
      code: p.code || "",
      name: p.name || "",
      parentProcessId: p.parentProcessId || "",
      orderInParent: p.orderInParent ?? 1,
      isActive: Boolean(p.isActive ?? true),
      title: p.title || "",
      objectivesBlocks: getObjectivesBlocks(p),
      stakeholders: Array.isArray(p.stakeholders) ? p.stakeholders : [],
      pilotIds: getPilotIds(p),
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
        objectivesBlocks: getObjectivesBlocks(proc),
        stakeholders: Array.isArray(proc.stakeholders) ? proc.stakeholders : [],
        pilotIds: getPilotIds(proc),
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
        objectivesBlocks: Array.isArray(v.objectivesBlocks) ? v.objectivesBlocks : [],
        stakeholders: Array.isArray(v.stakeholders) ? v.stakeholders : [],
        referenceDocuments: Array.isArray(v.referenceDocuments) ? v.referenceDocuments : [],
      };
      const pilotIds: string[] = Array.isArray(v.pilotIds) ? v.pilotIds : [];

      if (!payload.code || !payload.name) throw new Error("code et name sont obligatoires");

      if (!editing?.id) {
        const createRes = await adminCreateProcess(payload);
        const createdId = createRes.data?.id;
        if (createdId && pilotIds.length > 0) {
          await adminSetProcessPilots(createdId, pilotIds);
        }
        message.success("Processus créé");
        setOpen(false);
        await reload();
        return;
      }

      await adminPatchProcess(editing.id, payload);
      await adminSetProcessPilots(editing.id, pilotIds);
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

                  <Form.Item name="objectivesBlocks" label="Objectifs">
                    <ObjectivesBlocksEditor />
                  </Form.Item>

                  <Form.Item name="pilotIds" label="Pilote(s)">
                    <Select
                      mode="multiple"
                      options={pilotOptions}
                      placeholder="Sélectionner le(s) pilote(s)..."
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                    />
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
                  processName={`${editing.code} - ${editing.name}`}
                  onSaved={async () => {
                    try {
                      const full = await adminGetProcess(editing.id);
                      setEditing(full.data as ProcessFull);
                    } catch {
                      // Ignore - data already saved via SipocEditor
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
