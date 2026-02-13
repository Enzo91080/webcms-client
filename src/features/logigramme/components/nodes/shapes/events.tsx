import type { ShapeDefinition, ShapeRenderProps } from "./types";

// Shared event circle renderer
function EventCircle({
  fill, stroke, text, fontSize, label,
  strokeWidth = 2,
  doubleCircle = false,
  glyph,
}: ShapeRenderProps & { strokeWidth?: number; doubleCircle?: boolean; glyph?: React.ReactNode }) {
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
        viewBox="0 0 60 60"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <circle cx="30" cy="30" r="27" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        {doubleCircle && (
          <circle cx="30" cy="30" r="23" fill="none" stroke={stroke} strokeWidth={1.5} />
        )}
        {glyph}
      </svg>
      <div
        style={{
          position: "relative",
          color: text,
          fontSize: Math.min(fontSize, 11),
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.1,
          padding: 4,
          marginTop: 20,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// Glyphs
const MessageGlyph = (
  <g transform="translate(21,18)">
    <rect x="0" y="2" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <polyline points="0,2 9,9 18,2" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </g>
);

const TimerGlyph = (
  <g transform="translate(21,18)">
    <circle cx="9" cy="9" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <line x1="9" y1="9" x2="9" y2="4" stroke="currentColor" strokeWidth="1.5" />
    <line x1="9" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.5" />
  </g>
);

const ErrorGlyph = (
  <g transform="translate(22,17)">
    <polyline points="0,14 5,2 10,11 16,0" fill="none" stroke="currentColor" strokeWidth="2" />
  </g>
);

const SignalGlyph = (
  <g transform="translate(22,17)">
    <polygon points="8,0 16,14 0,14" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </g>
);

export const eventShapes: ShapeDefinition[] = [
  // Start events
  {
    key: "event-start",
    category: "events",
    label: "Début",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={2} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#e8f5e9" stroke="#4caf50" strokeWidth="2" />
      </svg>
    ),
  },
  {
    key: "event-start-message",
    category: "events",
    label: "Début Message",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={2} glyph={MessageGlyph} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#e8f5e9" stroke="#4caf50" strokeWidth="2" />
        <rect x="7" y="8" width="10" height="7" rx="1" fill="none" stroke="#4caf50" strokeWidth="1" />
      </svg>
    ),
  },
  {
    key: "event-start-timer",
    category: "events",
    label: "Début Timer",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={2} glyph={TimerGlyph} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#e8f5e9" stroke="#4caf50" strokeWidth="2" />
        <circle cx="12" cy="12" r="5" fill="none" stroke="#4caf50" strokeWidth="1" />
      </svg>
    ),
  },
  // Intermediate events
  {
    key: "event-intermediate",
    category: "events",
    label: "Intermédiaire",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={2} doubleCircle />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#fff3e0" stroke="#ff9800" strokeWidth="2" />
        <circle cx="12" cy="12" r="7" fill="none" stroke="#ff9800" strokeWidth="1" />
      </svg>
    ),
  },
  {
    key: "event-intermediate-message",
    category: "events",
    label: "Inter. Message",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={2} doubleCircle glyph={MessageGlyph} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#fff3e0" stroke="#ff9800" strokeWidth="2" />
        <circle cx="12" cy="12" r="7" fill="none" stroke="#ff9800" strokeWidth="1" />
        <rect x="8" y="9" width="8" height="5" rx="1" fill="none" stroke="#ff9800" strokeWidth="1" />
      </svg>
    ),
  },
  {
    key: "event-intermediate-timer",
    category: "events",
    label: "Inter. Timer",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={2} doubleCircle glyph={TimerGlyph} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#fff3e0" stroke="#ff9800" strokeWidth="2" />
        <circle cx="12" cy="12" r="7" fill="none" stroke="#ff9800" strokeWidth="1" />
        <circle cx="12" cy="12" r="3" fill="none" stroke="#ff9800" strokeWidth="1" />
      </svg>
    ),
  },
  // End events
  {
    key: "event-end",
    category: "events",
    label: "Fin",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={3.5} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#ffebee" stroke="#f44336" strokeWidth="3" />
      </svg>
    ),
  },
  {
    key: "event-end-message",
    category: "events",
    label: "Fin Message",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={3.5} glyph={MessageGlyph} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#ffebee" stroke="#f44336" strokeWidth="3" />
        <rect x="7" y="8" width="10" height="7" rx="1" fill="#f44336" stroke="none" />
      </svg>
    ),
  },
  {
    key: "event-end-error",
    category: "events",
    label: "Fin Erreur",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={3.5} glyph={ErrorGlyph} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#ffebee" stroke="#f44336" strokeWidth="3" />
        <polyline points="8,16 10,8 14,14 16,6" fill="none" stroke="#f44336" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: "event-end-signal",
    category: "events",
    label: "Fin Signal",
    defaultWidth: 60,
    defaultHeight: 60,
    render: (p) => <EventCircle {...p} strokeWidth={3.5} glyph={SignalGlyph} />,
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#ffebee" stroke="#f44336" strokeWidth="3" />
        <polygon points="12,6 17,16 7,16" fill="#f44336" stroke="none" />
      </svg>
    ),
  },
];
