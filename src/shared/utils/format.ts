/**
 * Formate le label d'un processus pour affichage dans les selects.
 */
export function formatProcessLabel(p: { code: string; name: string }): string {
  return `${p.code} — ${p.name}`;
}
