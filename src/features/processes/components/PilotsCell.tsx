import { Popover, Space, Tag } from "antd";

/**
 * Retourne un nom de pilote exploitable, même si l'API renvoie des formats variés.
 * Supporte:
 * - { id, name }
 * - string (nom)
 */
export function getPilotName(p: any): string | null {
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
export function PilotsCell({ pilots }: { pilots: any[] | undefined }) {
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
            <Tag key={name} color="yellow">
              {name}
            </Tag>
          ))}
        </Space>
      }
    >
      <Tag color="yellow" style={{ cursor: "pointer" }}>
        {names[0]}
        <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.85 }}>
          +{names.length - 1}
        </span>
      </Tag>
    </Popover>
  );
}
