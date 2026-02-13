import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ProcessFull } from "../../../shared/types";

interface ProcessesTableProps {
  columns: ColumnsType<ProcessFull>;
  data: ProcessFull[];
  loading: boolean;
}

export function ProcessesTable({ columns, data, loading }: ProcessesTableProps) {
  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 12 }}
      expandable={{
        expandRowByClick: true,
        childrenColumnName: "children",
        indentSize: 18,
      }}
    />
  );
}
