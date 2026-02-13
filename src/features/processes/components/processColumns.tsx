import { Button, Popconfirm, Space, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ProcessFull } from "../../../shared/types";
import { PilotsCell } from "./PilotsCell";
import { PROCESS_TYPE_LABELS } from "../constants";

interface BuildColumnsArgs {
  items: ProcessFull[];
  onEdit: (record: ProcessFull) => void;
  onDelete: (record: ProcessFull) => void;
}

export function buildProcessColumns({
  items,
  onEdit,
  onDelete,
}: BuildColumnsArgs): ColumnsType<ProcessFull> {
  return [
    { title: "Code", dataIndex: "code", key: "code", width: 200 },
    {
      title: "Nom",
      dataIndex: "name",
      key: "name",
      render: (value: string, record: ProcessFull) => (
        <span
          style={{ cursor: "pointer" }}
          onClick={() => onEdit(record)}
          role="button"
          tabIndex={0}
        >
          {value}
        </span>
      ),
    },
    {
      title: "Parent",
      key: "parent",
      width: 100,
      render: (_: any, r: ProcessFull) => {
        if (!r.parentProcessId) return <Tag color="blue">Racine</Tag>;
        const parent = items.find((x) => x.id === r.parentProcessId);
        return <span>{parent?.code || "?"}</span>;
      },
    },
    {
      title: "Pilotes",
      key: "pilots",
      width: 150,
      render: (_: any, r: ProcessFull) => <PilotsCell pilots={r.pilots as any} />,
    },
    {
      title: "Type",
      key: "processType",
      width: 160,
      render: (_: any, r: ProcessFull) => {
        const label = r.processType ? PROCESS_TYPE_LABELS[r.processType] : null;
        if (!label) return <Tag>—</Tag>;
        const color = r.processType === "internal" ? "blue" : "orange";
        return <Tag color={color}>{label}</Tag>;
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
      width: 100,
      render: (_: any, r: ProcessFull) => (
        <Space>
          <Tooltip title="Éditer">
            <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(r)} />
          </Tooltip>
          <Popconfirm title="Supprimer ce processus ?" onConfirm={() => onDelete(r)}>
            <Tooltip title="Supprimer">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
