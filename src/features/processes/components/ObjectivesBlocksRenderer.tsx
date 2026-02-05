import { List, Typography, theme } from "antd";
import type { ObjectiveBlock } from "../../../shared/types";
import type React from "react";

type Props = {
  blocks: ObjectiveBlock[];
  textStyle?: React.CSSProperties;
  variant?: "light" | "dark"; // NEW: light = fond clair, dark = fond bleu
};

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `,${alpha})`);
  if (color.startsWith("rgba("))
    return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/, `rgba($1,$2,$3,${alpha})`);
  return color;
}

/**
 * Rendu des objectivesBlocks structurés (text, bullets, numbered).
 * Par défaut: "light" => lisible sur fond blanc, basé sur tokens AntD.
 */
export function ObjectivesBlocksRenderer({ blocks, textStyle, variant = "light" }: Props) {
  const { token } = theme.useToken();
  const isDark = variant === "dark";

  const defaultStyle: React.CSSProperties = {
    color: isDark ? withAlpha(token.colorWhite, 0.9) : token.colorTextBase,
    fontSize: 13,
    lineHeight: 1.6,
  };

  const style = { ...defaultStyle, ...textStyle };

  const bulletColor =
    textStyle?.color ??
    (isDark ? withAlpha(token.colorWhite, 0.85) : token.colorPrimary);

  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          return (
            <Typography.Text key={idx} style={{ ...style, display: "block", marginBottom: 8 }}>
              {block.text}
            </Typography.Text>
          );
        }

        const items = block.items.filter((it) => it.trim());
        if (!items.length) return null;

        return (
          <List
            key={idx}
            size="small"
            dataSource={items}
            style={{ marginBottom: 8 }}
            renderItem={(item, itemIdx) => (
              <List.Item style={{ border: "none", padding: "4px 0" }}>
                <Typography.Text style={style}>
                  <span
                    style={{
                      fontWeight: 800,
                      marginRight: 8,
                      color: bulletColor,
                      minWidth: 20,
                      display: "inline-block",
                    }}
                  >
                    {block.type === "numbered" ? `${itemIdx + 1}.` : "•"}
                  </span>
                  {item}
                </Typography.Text>
              </List.Item>
            )}
          />
        );
      })}
    </>
  );
}
