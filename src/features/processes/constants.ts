export const PROCESS_TYPE_LABELS: Record<string, string> = {
  internal: "Interne",
  external: "Externe",
};

export const PROCESS_TYPE_OPTIONS = [
  { value: "internal", label: "Interne" },
  { value: "external", label: "Externe" },
];

export const PROCESS_TYPE_FILTER_OPTIONS = [
  { value: "", label: "Tous" },
  ...PROCESS_TYPE_OPTIONS,
];
