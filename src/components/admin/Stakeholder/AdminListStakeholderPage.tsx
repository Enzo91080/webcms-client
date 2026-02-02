import {
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import {
  adminCreateStakeholder,
  adminDeleteStakeholder,
  adminListStakeholders,
  adminPatchStakeholder,
  type Stakeholder,
} from "../../../api";

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  return String(e);
}

export default function AdminStakeholdersPage() {
  const [items, setItems] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Stakeholder | null>(null);

  const [form] = Form.useForm();

  async function reload() {
    try {
      setLoading(true);
      const res = await adminListStakeholders();
      setItems((res.data || []) as Stakeholder[]);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function openCreate() {
    setEditing(null);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      name: "",
      isActive: true,
    });
  }

  function openEdit(s: Stakeholder) {
    setEditing(s);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      name: s.name || "",
      isActive: Boolean(s.isActive ?? true),
    });
  }

  async function saveStakeholder() {
    try {
      const v = await form.validateFields();
      const payload = {
        name: String(v.name).trim(),
        isActive: Boolean(v.isActive),
      };

      if (!payload.name) throw new Error("Le nom est obligatoire");

      if (!editing?.id) {
        await adminCreateStakeholder({ name: payload.name });
        message.success("Partie intéressée créée");
        setOpen(false);
        await reload();
        return;
      }

      await adminPatchStakeholder(editing.id, payload);
      message.success("Partie intéressée enregistrée");
      setOpen(false);
      await reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  async function doDelete(s: Stakeholder) {
    try {
      await adminDeleteStakeholder(s.id);
      message.success("Supprimé");
      if (editing?.id === s.id) setOpen(false);
      await reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  const columns: ColumnsType<Stakeholder> = [
    { title: "Nom", dataIndex: "name", key: "name" },
    {
      title: "Actif",
      key: "isActive",
      width: 100,
      render: (_: any, r: Stakeholder) => (
        <Tag color={r.isActive ? "green" : "default"}>{r.isActive ? "Oui" : "Non"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_: any, r: Stakeholder) => (
        <Space>
          <Button size="small" onClick={() => openEdit(r)}>
            Éditer
          </Button>
          <Popconfirm title="Supprimer cette partie intéressée ?" onConfirm={() => doDelete(r)}>
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
          + Nouvelle partie intéressée
        </Button>
        <Button onClick={reload} loading={loading}>
          Rafraîchir
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 12 }}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Éditer — ${editing.name}` : "Nouvelle partie intéressée"}
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: "Nom requis" }]}
          >
            <Input placeholder="Ex: Commercial, ADV, Direction..." />
          </Form.Item>

          <Form.Item name="isActive" label="Actif" valuePropName="checked">
            <Switch />
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
