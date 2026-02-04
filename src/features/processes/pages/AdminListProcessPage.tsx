import {
  Button,
  Col,
  Collapse,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Popover,
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
import { useCallback, useEffect, useMemo, useState } from "react";

import { LogigrammeEditor } from "../../logigramme/components";
import ProcessPreview from "../components/ProcessPreview";
import SipocEditor from "../../sipoc/components/SipocEditor";
import ObjectivesBlocksEditor from "../components/ObjectivesBlocksEditor";

import {
  adminCreateProcess,
  adminDeleteProcess,
  adminGetProcess,
  adminListPilots,
  adminListProcesses,
  adminListStakeholders,
  adminPatchProcess,
  adminSetProcessPilots,
  adminSetProcessStakeholders,
  type Pilot,
  type Stakeholder,
  type ProcessStakeholderItem,
} from "../../../shared/api";

import {
  ProcessFull,
  ObjectiveBlock,
  StakeholderLinkFields,
  ProcessStakeholder,
} from "../../../shared/types";
import { getErrorMessage } from "../../../shared/utils/error";
import { normalizeDocs } from "../../../shared/utils/normalize";

// ============================================================================
// Helpers - Objectives (legacy string -> blocks)
// ============================================================================

/**
 * Parse un string objectives (ancien format) en ObjectiveBlock[].
 * Détecte automatiquement :
 * - Lignes numérotées (1., 2., etc.) → bloc "numbered" (si pas de sous-éléments)
 * - Lignes numérotées suivies de sous-éléments → bloc "text" + bloc "bullets"
 * - Lignes simples → bloc "text"
 */
function parseObjectivesToBlocks(input: string): ObjectiveBlock[] {
  if (!input || typeof input !== "string") return [];

  const lines = input.split(/\r?\n/);
  const blocks: ObjectiveBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i++;
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
    if (numberedMatch) {
      const mainText = numberedMatch[2].trim();

      // Collecte sous-éléments éventuels (lignes non-numérotées suivantes)
      const subItems: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextTrimmed = lines[j].trim();
        if (!nextTrimmed) break;
        if (/^\d+\.\s*/.test(nextTrimmed)) break;

        const cleaned = nextTrimmed.replace(/^[-•]\s*/, "").trim();
        if (cleaned) subItems.push(cleaned);
        j++;
      }

      if (subItems.length > 0) {
        if (mainText) blocks.push({ type: "text", text: mainText });
        blocks.push({ type: "bullets", items: subItems });
        i = j;
        continue;
      }

      // Sinon, on essaie de regrouper des lignes numérotées consécutives en un seul bloc "numbered"
      const numberedItems: string[] = [];
      if (mainText) numberedItems.push(mainText);

      let k = j;
      while (k < lines.length) {
        const nextTrimmed = lines[k].trim();
        if (!nextTrimmed) {
          k++;
          continue;
        }

        const nextNumbered = nextTrimmed.match(/^(\d+)\.\s*(.*)/);
        if (!nextNumbered) break;

        // Si cette ligne numérotée possède des sous-éléments, stop : on garde le regroupement actuel
        let hasSubItems = false;
        let m = k + 1;
        while (m < lines.length) {
          const check = lines[m].trim();
          if (!check) break;
          if (/^\d+\.\s*/.test(check)) break;
          hasSubItems = true;
          break;
        }
        if (hasSubItems) break;

        const itemText = nextNumbered[2].trim();
        if (itemText) numberedItems.push(itemText);
        k++;
      }

      if (numberedItems.length > 0) blocks.push({ type: "numbered", items: numberedItems });
      i = k;
      continue;
    }

    // Ligne simple → text
    const cleanedLine = trimmed.replace(/^[-•]\s*/, "").trim();
    if (cleanedLine) blocks.push({ type: "text", text: cleanedLine });
    i++;
  }

  return blocks;
}

// ============================================================================
// Helpers - Tree building for the table
// ============================================================================

/**
 * Construit un arbre à partir d’une liste plate de processus.
 * - Injecte "children" par parentProcessId
 * - Trie par orderInParent puis code
 * - Supprime "children" vides (pour éviter une UI bruitée)
 */
function buildTree(items: ProcessFull[]) {
  const nodes = items.map((p) => ({ ...p, children: [] as ProcessFull[] }));
  const byId = new Map<string, ProcessFull>();
  nodes.forEach((n) => byId.set(n.id, n));

  const roots: ProcessFull[] = [];
  for (const n of nodes) {
    const parent = n.parentProcessId ? byId.get(n.parentProcessId) : null;
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
    arr.forEach((x) => x.children?.length && sortRec(x.children));
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

// ============================================================================
// Helpers - Pilots UI (robuste et sans "tirets")
// ============================================================================

/**
 * Retourne un nom de pilote exploitable, même si l’API renvoie des formats variés.
 * Supporte:
 * - { id, name }
 * - string (nom)
 */
function getPilotName(p: any): string | null {
  if (!p) return null;
  if (typeof p === "string") return p.trim() || null;
  if (typeof p?.name === "string") return p.name.trim() || null;
  return null;
}

/**
 * Rendu compact des pilotes:
 * - 0 pilote -> Tag "Aucun"
 * - 1 pilote -> Tag
 * - N pilotes -> 1er Tag + Popover (+N)
 */
function PilotsCell({ pilots }: { pilots: any[] | undefined }) {
  const names = (Array.isArray(pilots) ? pilots : [])
    .map(getPilotName)
    .filter((x): x is string => Boolean(x));

  if (names.length === 0) return <Tag style={{ opacity: 0.7 }}>Aucun</Tag>;

  if (names.length === 1) {
    return <Tag color="green">{names[0]}</Tag>;
  }

  return (
    <Popover
      content={
        <Space direction="vertical">
          {names.slice(1).map((name) => (
            <Tag key={name} color="green">
              {name}
            </Tag>
          ))}
        </Space>
      }
    >
      <Tag color="green" style={{ cursor: "pointer" }}>
        {names[0]}
        <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.85 }}>
          +{names.length - 1}
        </span>
      </Tag>
    </Popover>
  );
}

// ============================================================================
// Types - Stakeholder link editing in UI
// ============================================================================

/**
 * Données UI pour la section "Détails par partie intéressée".
 * On garde l'identité (stakeholderId, name, isActive) + les champs enrichis.
 */
type StakeholderLinkData = {
  stakeholderId: string;
  name: string;
  isActive: boolean;
} & StakeholderLinkFields;

// ============================================================================
// Component
// ============================================================================

export default function AdminProcessesPage() {
  // ----------------------------
  // State
  // ----------------------------
  const [items, setItems] = useState<ProcessFull[]>([]);
  const [loading, setLoading] = useState(false);

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessFull | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  const [stakeholderLinks, setStakeholderLinks] = useState<StakeholderLinkData[]>([]);
  const [q, setQ] = useState(""); // recherche

  const [form] = Form.useForm();

  // ----------------------------
  // Data loading
  // ----------------------------
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListProcesses();
      setItems((res.data || []) as ProcessFull[]);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStakeholders = useCallback(async () => {
    try {
      const res = await adminListStakeholders();
      setStakeholders((res.data || []).filter((s) => s.isActive));
    } catch (e) {
      console.warn("Failed to load stakeholders", e);
    }
  }, []);

  const loadPilots = useCallback(async () => {
    try {
      const res = await adminListPilots();
      setPilots((res.data || []).filter((p) => p.isActive));
    } catch (e) {
      console.warn("Failed to load pilots", e);
    }
  }, []);

  useEffect(() => {
    reload();
    loadStakeholders();
    loadPilots();
  }, [reload, loadStakeholders, loadPilots]);

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

  const stakeholderOptions = useMemo(
    () => stakeholders.map((s) => ({ value: s.id, label: s.name })),
    [stakeholders]
  );

  const pilotOptions = useMemo(
    () => pilots.map((p) => ({ value: p.id, label: p.name })),
    [pilots]
  );

  const stakeholdersById = useMemo(() => new Map(stakeholders.map((s) => [s.id, s])), [stakeholders]);

  /**
   * Filtrage simple et rapide:
   * - code / name
   * - pilotes (si présents dans l’objet process reçu par l’API)
   */
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

  const treeData = useMemo(() => buildTree(filteredItems), [filteredItems]);

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

  /**
   * Construit les valeurs du formulaire + les stakeholderLinks depuis un ProcessFull.
   * Centralise toute la logique pour éviter les répétitions dans openEdit().
   */
  function deriveFormFromProcess(proc: ProcessFull) {
    const objectivesBlocks: ObjectiveBlock[] = Array.isArray(proc.objectivesBlocks) && proc.objectivesBlocks.length > 0
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
    // 1) UI immédiate avec l’objet lite
    setEditing(p);
    setActiveTab("general");
    setOpen(true);

    const lite = deriveFormFromProcess(p);
    setStakeholderLinks(lite.stakeholderLinks);

    form.resetFields();
    form.setFieldsValue(lite.formValues);

    // 2) Re-fetch full (sipoc/logigramme/etc.)
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

      // Refresh editing with full doc (preview/sipoc/logigramme cohérents)
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
      {/* Header */}
      <Row
        gutter={[16, 16]}
        align="middle"
        justify="space-between"
        style={{ marginBottom: 12 }}
      >
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
            {/* Recherche à gauche du bouton Nouvelle */}
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

      {/* Table */}
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

      {/* Drawer */}
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
                  {/* Identité du processus */}
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

                  {/* Description / Objectifs */}
                  <Form.Item name="title" label="Objet du processus">
                    <Input.TextArea rows={3} />
                  </Form.Item>

                  <Form.Item name="objectivesBlocks" label="Objectifs">
                    <ObjectivesBlocksEditor />
                  </Form.Item>

                  {/* Pilotes */}
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

                  {/* Parties intéressées */}
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

                  {/* Détails par stakeholder */}
                  {stakeholderLinks.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                        Détails par partie intéressée
                      </Typography.Text>

                      <Collapse
                        accordion
                        items={stakeholderLinks.map((link) => ({
                          key: link.stakeholderId,
                          label: (
                            <span>
                              {link.name}
                              {!link.isActive && (
                                <Tag color="default" style={{ marginLeft: 8 }}>
                                  Inactif
                                </Tag>
                              )}
                            </span>
                          ),
                          children: (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Besoins
                                </Typography.Text>
                                <Input.TextArea
                                  rows={2}
                                  value={link.needs ?? ""}
                                  onChange={(e) => updateLinkField(link.stakeholderId, "needs", e.target.value)}
                                  placeholder="Besoins de cette partie intéressée..."
                                />
                              </div>

                              <div>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Attentes
                                </Typography.Text>
                                <Input.TextArea
                                  rows={2}
                                  value={link.expectations ?? ""}
                                  onChange={(e) =>
                                    updateLinkField(link.stakeholderId, "expectations", e.target.value)
                                  }
                                  placeholder="Attentes..."
                                />
                              </div>

                              <div>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Éléments d'évaluation
                                </Typography.Text>
                                <Input.TextArea
                                  rows={2}
                                  value={link.evaluationCriteria ?? ""}
                                  onChange={(e) =>
                                    updateLinkField(link.stakeholderId, "evaluationCriteria", e.target.value)
                                  }
                                  placeholder="Critères d'évaluation..."
                                />
                              </div>

                              <div>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Exigences
                                </Typography.Text>
                                <Input.TextArea
                                  rows={2}
                                  value={link.requirements ?? ""}
                                  onChange={(e) =>
                                    updateLinkField(link.stakeholderId, "requirements", e.target.value)
                                  }
                                  placeholder="Exigences..."
                                />
                              </div>

                              <div>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Forces
                                </Typography.Text>
                                <Input.TextArea
                                  rows={2}
                                  value={link.strengths ?? ""}
                                  onChange={(e) => updateLinkField(link.stakeholderId, "strengths", e.target.value)}
                                  placeholder="Forces..."
                                />
                              </div>

                              <div>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Faiblesses
                                </Typography.Text>
                                <Input.TextArea
                                  rows={2}
                                  value={link.weaknesses ?? ""}
                                  onChange={(e) =>
                                    updateLinkField(link.stakeholderId, "weaknesses", e.target.value)
                                  }
                                  placeholder="Faiblesses..."
                                />
                              </div>

                              <div>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Opportunités
                                </Typography.Text>
                                <Input.TextArea
                                  rows={2}
                                  value={link.opportunities ?? ""}
                                  onChange={(e) =>
                                    updateLinkField(link.stakeholderId, "opportunities", e.target.value)
                                  }
                                  placeholder="Opportunités..."
                                />
                              </div>

                              <div>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Risques
                                </Typography.Text>
                                <Input.TextArea
                                  rows={2}
                                  value={link.risks ?? ""}
                                  onChange={(e) => updateLinkField(link.stakeholderId, "risks", e.target.value)}
                                  placeholder="Risques..."
                                />
                              </div>

                              <div style={{ gridColumn: "1 / -1" }}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Plan d'actions
                                </Typography.Text>
                                <Input.TextArea
                                  rows={3}
                                  value={link.actionPlan ?? ""}
                                  onChange={(e) =>
                                    updateLinkField(link.stakeholderId, "actionPlan", e.target.value)
                                  }
                                  placeholder="Plan d'actions..."
                                />
                              </div>
                            </div>
                          ),
                        }))}
                      />
                    </div>
                  )}

                  {/* Documents de référence */}
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
                <div style={{ opacity: 0.7 }}>Crée d’abord le processus puis édite le logigramme.</div>
              ),
            },
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
