import { Badge, Card, Space, Typography } from "antd";
import type { ProcessFull } from "../../../shared/types";

type Props = {
  logigramme: ProcessFull["logigramme"];
  height?: string | number;
};

type LegendItem = {
  key?: string;
  number?: string;
  label?: string;
  color?: string;
  bg?: string;
};

/**
 * Légende du logigramme (affichée à droite du viewer).
 */
export function ProcessLegend({ logigramme, height = "calc(100vh - 420px)" }: Props) {
  const legend: LegendItem[] = Array.isArray((logigramme as any)?.legend)
    ? (logigramme as any).legend
    : [];

  return (
    <Card
      size="small"
      style={{ borderRadius: 8, height, minHeight: 500, maxHeight: 800 }}
      bodyStyle={{ padding: 16, height: "100%", overflow: "auto" }}
      title={
        <Typography.Text strong style={{ fontSize: 14 }}>
          Légende
        </Typography.Text>
      }
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {legend.length > 0 ? (
          legend.map((it, idx) => {
            const color = it.color || "#0ea5e9";
            const key = (it.key || it.number || "").toString();
            return (
              <Space key={idx} size={10} style={{ width: "100%" }}>
                <Badge
                  count={key}
                  style={{
                    backgroundColor: color,
                    border: `2px solid ${color}`,
                    minWidth: 36,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                />
                <Typography.Text style={{ fontSize: 13, flex: 1 }}>{it.label || ""}</Typography.Text>
              </Space>
            );
          })
        ) : (
          <>
            <Space size={10} style={{ width: "100%" }}>
              <Badge
                count="1"
                style={{
                  backgroundColor: "#2563eb",
                  minWidth: 36,
                  height: 32,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              />
              <Typography.Text style={{ fontSize: 13, flex: 1 }}>Commercial</Typography.Text>
            </Space>
            <Space size={10} style={{ width: "100%" }}>
              <Badge
                count="2"
                style={{
                  backgroundColor: "#22c55e",
                  minWidth: 36,
                  height: 32,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              />
              <Typography.Text style={{ fontSize: 13, flex: 1 }}>ADV</Typography.Text>
            </Space>
          </>
        )}
      </Space>
    </Card>
  );
}
