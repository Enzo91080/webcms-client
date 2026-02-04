/**
 * Type pour un document de référence normalisé.
 */
export type NormalizedDoc = {
  code: string;
  title: string;
  type: string;
  url: string;
};

/**
 * Normalise la liste des documents de référence depuis n'importe quelle source.
 * Garantit une structure stable.
 */
export function normalizeDocs(input: unknown): NormalizedDoc[] {
  if (!Array.isArray(input)) return [];
  return input.map((d: any) => ({
    code: String(d?.code || ""),
    title: String(d?.title || ""),
    type: String(d?.type || ""),
    url: String(d?.url || ""),
  }));
}

/**
 * Normalise une liste de stakeholders depuis n'importe quelle source.
 */
export function normalizeStakeholders(input: unknown): string[] {
  if (Array.isArray(input) && input.every((x) => typeof x === "string")) {
    return input;
  }
  return [];
}

/**
 * Normalise une chaîne ou tableau en tableau de lignes non vides.
 */
export function normalizeObjectives(input: unknown): string[] {
  if (Array.isArray(input)) {
    const arr = input
      .map((x) => (typeof x === "string" ? x.trim() : String(x ?? "").trim()))
      .filter(Boolean);
    if (arr.length) return arr;
  }

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return [];
    const lines = s
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*[-•]\s*/, "").trim())
      .filter(Boolean);
    return lines.length ? lines : [s];
  }

  return [];
}
