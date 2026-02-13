import type { ShapeDefinition, ShapeRenderProps } from "./types";

// Shared task rectangle renderer (rounded corners like BPMN)
function TaskRect({
  fill, stroke, text, fontSize, label,
  badge,
}: ShapeRenderProps & { badge?: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: fill,
        border: `2px solid ${stroke}`,
        borderRadius: 10,
        color: text,
        fontSize,
        display: "grid",
        placeItems: "center",
        fontWeight: 600,
        padding: "10px 12px",
        textAlign: "center",
        lineHeight: 1.2,
        position: "relative",
      }}
    >
      {badge && (
        <div style={{ position: "absolute", top: 4, left: 6, opacity: 0.6 }}>
          {badge}
        </div>
      )}
      {label}
    </div>
  );
}

// Badge icons (small SVGs in top-left corner)
const UserBadge = (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <circle cx="7" cy="4.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1,13 Q1,9 7,9 Q13,9 13,13" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const ServiceBadge = (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <circle cx="7" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
  </svg>
);

const ManualBadge = (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <path d="M2,10 L2,5 Q2,3 5,3 L12,3 L12,5 L5,5 L5,10 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const ScriptBadge = (
  <svg width="14" height="14" viewBox="0 0 14 14">
    <path d="M3,2 L11,2 Q12,2 12,3 L12,11 Q12,12 11,12 L3,12 Q2,12 2,11 L2,3 Q2,2 3,2 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <line x1="5" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1" />
    <line x1="5" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1" />
    <line x1="5" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const taskShapes: ShapeDefinition[] = [
  {
    key: "task",
    category: "tasks",
    label: "Tâche",
    defaultWidth: 220,
    defaultHeight: 64,
    render: (p) => <TaskRect {...p} />,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="6" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: "task-user",
    category: "tasks",
    label: "Tâche Utilisateur",
    defaultWidth: 220,
    defaultHeight: 64,
    render: (p) => <TaskRect {...p} badge={UserBadge} />,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="6" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2.5" fill="none" stroke="#1976d2" strokeWidth="1" />
      </svg>
    ),
  },
  {
    key: "task-service",
    category: "tasks",
    label: "Tâche Service",
    defaultWidth: 220,
    defaultHeight: 64,
    render: (p) => <TaskRect {...p} badge={ServiceBadge} />,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="6" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="3" fill="none" stroke="#1976d2" strokeWidth="1" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
  {
    key: "task-manual",
    category: "tasks",
    label: "Tâche Manuelle",
    defaultWidth: 220,
    defaultHeight: 64,
    render: (p) => <TaskRect {...p} badge={ManualBadge} />,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="6" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1.5" />
        <path d="M5,13 L5,8 Q5,6 8,6 L13,6" fill="none" stroke="#1976d2" strokeWidth="1" />
      </svg>
    ),
  },
  {
    key: "task-script",
    category: "tasks",
    label: "Tâche Script",
    defaultWidth: 220,
    defaultHeight: 64,
    render: (p) => <TaskRect {...p} badge={ScriptBadge} />,
    icon: () => (
      <svg width="36" height="24" viewBox="0 0 36 24">
        <rect x="1" y="1" width="34" height="22" rx="6" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1.5" />
        <line x1="5" y1="8" x2="12" y2="8" stroke="#1976d2" strokeWidth="1" />
        <line x1="5" y1="11" x2="10" y2="11" stroke="#1976d2" strokeWidth="1" />
      </svg>
    ),
  },
];
