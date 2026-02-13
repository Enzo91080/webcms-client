import type { ShapeDefinition, ShapeRenderProps } from "./types";

// Shared gateway diamond renderer
function GatewayDiamond({
  fill, stroke, text, fontSize, label,
  glyph,
}: ShapeRenderProps & { glyph?: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg
        viewBox="0 0 80 80"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <rect
          x="8" y="8" width="64" height="64" rx="4"
          fill={fill} stroke={stroke} strokeWidth="2.5"
          transform="rotate(45 40 40)"
        />
        {glyph}
      </svg>
      <div
        style={{
          position: "relative",
          color: text,
          fontSize: Math.min(fontSize, 11),
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.1,
          padding: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Gateway glyphs
const ExclusiveGlyph = (
  <g>
    <line x1="31" y1="31" x2="49" y2="49" stroke="currentColor" strokeWidth="3" />
    <line x1="49" y1="31" x2="31" y2="49" stroke="currentColor" strokeWidth="3" />
  </g>
);

const ParallelGlyph = (
  <g>
    <line x1="40" y1="26" x2="40" y2="54" stroke="currentColor" strokeWidth="3" />
    <line x1="26" y1="40" x2="54" y2="40" stroke="currentColor" strokeWidth="3" />
  </g>
);

const InclusiveGlyph = (
  <circle cx="40" cy="40" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
);

const EventGlyph = (
  <g>
    <circle cx="40" cy="40" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="40" cy="40" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </g>
);

export const gatewayShapes: ShapeDefinition[] = [
  {
    key: "gateway-exclusive",
    category: "gateways",
    label: "Exclusive (XOR)",
    defaultWidth: 110,
    defaultHeight: 110,
    render: (p) => <GatewayDiamond {...p} glyph={ExclusiveGlyph} />,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" rx="2" fill="#fff8e1" stroke="#f9a825" strokeWidth="1.5" transform="rotate(45 15 15)" />
        <line x1="10" y1="10" x2="20" y2="20" stroke="#f9a825" strokeWidth="2" />
        <line x1="20" y1="10" x2="10" y2="20" stroke="#f9a825" strokeWidth="2" />
      </svg>
    ),
  },
  {
    key: "gateway-parallel",
    category: "gateways",
    label: "Parallèle (AND)",
    defaultWidth: 110,
    defaultHeight: 110,
    render: (p) => <GatewayDiamond {...p} glyph={ParallelGlyph} />,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" rx="2" fill="#fff8e1" stroke="#f9a825" strokeWidth="1.5" transform="rotate(45 15 15)" />
        <line x1="15" y1="9" x2="15" y2="21" stroke="#f9a825" strokeWidth="2" />
        <line x1="9" y1="15" x2="21" y2="15" stroke="#f9a825" strokeWidth="2" />
      </svg>
    ),
  },
  {
    key: "gateway-inclusive",
    category: "gateways",
    label: "Inclusive (OR)",
    defaultWidth: 110,
    defaultHeight: 110,
    render: (p) => <GatewayDiamond {...p} glyph={InclusiveGlyph} />,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" rx="2" fill="#fff8e1" stroke="#f9a825" strokeWidth="1.5" transform="rotate(45 15 15)" />
        <circle cx="15" cy="15" r="5" fill="none" stroke="#f9a825" strokeWidth="2" />
      </svg>
    ),
  },
  {
    key: "gateway-event",
    category: "gateways",
    label: "Événement",
    defaultWidth: 110,
    defaultHeight: 110,
    render: (p) => <GatewayDiamond {...p} glyph={EventGlyph} />,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 30 30">
        <rect x="4" y="4" width="22" height="22" rx="2" fill="#fff8e1" stroke="#f9a825" strokeWidth="1.5" transform="rotate(45 15 15)" />
        <circle cx="15" cy="15" r="5" fill="none" stroke="#f9a825" strokeWidth="1.5" />
        <circle cx="15" cy="15" r="3" fill="none" stroke="#f9a825" strokeWidth="1" />
      </svg>
    ),
  },
];
