import {
  Button,
  Col,
  Divider,
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

import {
  adminCreatePilot,
  adminDeletePilot,
  adminPatchPilot,
  adminSetPilotProcesses,
  type Pilot,
} from "../../../shared/api";
import { useAdminPilots, useProcessOptions } from "../../../shared/hooks";
import { getErrorMessage, formatProcessLabel } from "../../../shared/utils";

type PilotWithProcesses = Pilot & {
  processIds?: string[];
};

export default function AdminPilotsPage() {
  // Data hooks
  const { items, loading, reload } = useAdminPilots();
  const { processes, options: processOptions, byId: processById, loading: loadingProcesses } = useProcessOptions();

  // UI state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PilotWithProcesses | null>(null);
  const [form] = Form.useForm();

  // Filters
  const [q, setQ] = useState("");
  const [processFilter, setProcessFilter] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return (items || []).filter((s) => {
      const okName = !qq || String(s.name || "").toLowerCase().includes(qq);
      const okProcess = !processFilter || ((s as PilotWithProcesses).processIds || []).includes(processFilter);
      return okName && okProcess;
    });
  }, [items, q, processFilter]);

  // ----------------------------
  // Drawer open / edit / create
  // ----------------------------
  function openCreate() {
    setEditing(null);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      name: "",
      isActive: true,
      processIds: [],
    });
  }

  function openEdit(s: PilotWithProcesses) {
    setEditing(s);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      name: s.name || "",
      isActive: Boolean(s.isActive ?? true),
      processIds: s.processIds || [],
    });
  }

  // ----------------------------
  // Save / Delete
  // ----------------------------
  async function savePilot() {
    try {
      const v = await form.validateFields();
      const name = String(v.name || "").trim();
      const isActive = Boolean(v.isActive);
      const processIds: string[] = Array.isArray(v.processIds) ? v.processIds : [];

      if (!name) throw new Error("Le nom est obligatoire");

      if (!editing?.id) {
        const createRes: any = await adminCreatePilot({ name });
        const createdId: string | undefined = createRes?.data?.id || createRes?.data?.pilot?.id;

        if (createdId) {
          await adminSetPilotProcesses(createdId, processIds);
          message.success("Pilote créé");
          setOpen(false);
          await reload();
          return;
        }

        await reload();
        const found = items.find((s) => String(s.name || "").trim() === name);
        if (found?.id) await adminSetPilotProcesses(found.id, processIds);

        message.success("Pilote créé");
        setOpen(false);
        await reload();
        return;
      }

      await adminPatchPilot(editing.id, { name, isActive });
      await adminSetPilotProcesses(editing.id, processIds);

      message.success("Pilote enregistré");
      setOpen(false);
      await reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  async function doDelete(s: PilotWithProcesses) {
    try {
      await adminDeletePilot(s.id);
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
  const columns: ColumnsType<PilotWithProcesses> = [
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      width: 260,
      sorter: (a, b) => String(a.name || "").localeCompare(String(b.name || "")),
      render: (value: string, record: any) => (
        <span
          style={{ cursor: "pointer" }}
          onClick={() => openEdit(record)}
          role="button"
          tabIndex={0}
        >
          {value}
        </span>
      ),
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
      render: (_: any, r: PilotWithProcesses) => (
        <Tag color={r.isActive ? "green" : "default"}>{r.isActive ? "Actif" : "Inactif"}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_: any, r: PilotWithProcesses) => (
        <Space>
          <Tooltip title="Éditer">
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Supprimer ce pilote ?" onConfirm={() => doDelete(r)}>
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
            Pilotes
          </Typography.Title>
          <Typography.Text type="secondary">{filteredItems.length} élément(s) affiché(s)</Typography.Text>
        </Col>

        <Col flex="none">
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nouveau
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
        dataSource={filteredItems as PilotWithProcesses[]}
        loading={loading}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        tableLayout="fixed"
        scroll={{ x: 980 }}
        expandable={{
          expandedRowRender: (r) => {
            const list = (r.processIds || [])
              .map((id) => processById.get(id))
              .filter(Boolean);

            if (!list.length) return <Typography.Text type="secondary">Aucun processus</Typography.Text>;

            return (
              <Space size={[6, 6]} wrap>
                {list.map((p) => (
                  <Tag key={p!.id}>{formatProcessLabel(p!)}</Tag>
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
        title={editing ? `Éditer — ${editing.name}` : "Nouveau pilote"}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nom" rules={[{ required: true, message: "Nom requis" }]}>
            <Input placeholder="Ex: Jean Dupont, Marie Martin..." />
          </Form.Item>

          <Form.Item name="processIds" label="Processus rattachés">
            <Select
              mode="multiple"
              placeholder="Sélectionnez un ou plusieurs processus"
              loading={loadingProcesses}
              options={processOptions}
              showSearch
              optionFilterProp="label"
              allowClear
              maxTagCount="responsive"
            />
          </Form.Item>

          <Divider style={{ margin: "12px 0" }} />

          <Form.Item name="isActive" label="Actif" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Space style={{ marginTop: 24 }}>
            <Button type="primary" onClick={savePilot}>
              Enregistrer
            </Button>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}
