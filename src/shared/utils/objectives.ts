import type { ObjectiveBlock } from "../types";

/**
 * Parse un string objectives (ancien format) en ObjectiveBlock[].
 * Détecte automatiquement :
 * - Lignes numérotées (1., 2., etc.) → bloc "numbered" (si pas de sous-éléments)
 * - Lignes numérotées suivies de sous-éléments → bloc "text" + bloc "bullets"
 * - Lignes simples → bloc "text"
 */
export function parseObjectivesToBlocks(input: string): ObjectiveBlock[] {
  if (!input || typeof input !== "string") return [];

  const lines = input.split(/\r?\n/);
  const blocks: ObjectiveBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      i++;
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
    if (numberedMatch) {
      const mainText = numberedMatch[2].trim();

      // Collecte sous-éléments éventuels (lignes non-numérotées suivantes)
      const subItems: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextTrimmed = lines[j].trim();
        if (!nextTrimmed) break;
        if (/^\d+\.\s*/.test(nextTrimmed)) break;

        const cleaned = nextTrimmed.replace(/^[-•]\s*/, "").trim();
        if (cleaned) subItems.push(cleaned);
        j++;
      }

      if (subItems.length > 0) {
        if (mainText) blocks.push({ type: "text", text: mainText });
        blocks.push({ type: "bullets", items: subItems });
        i = j;
        continue;
      }

      // Sinon, on essaie de regrouper des lignes numérotées consécutives en un seul bloc "numbered"
      const numberedItems: string[] = [];
      if (mainText) numberedItems.push(mainText);

      let k = j;
      while (k < lines.length) {
        const nextTrimmed = lines[k].trim();
        if (!nextTrimmed) {
          k++;
          continue;
        }

        const nextNumbered = nextTrimmed.match(/^(\d+)\.\s*(.*)/);
        if (!nextNumbered) break;

        // Si cette ligne numérotée possède des sous-éléments, stop : on garde le regroupement actuel
        let hasSubItems = false;
        let m = k + 1;
        while (m < lines.length) {
          const check = lines[m].trim();
          if (!check) break;
          if (/^\d+\.\s*/.test(check)) break;
          hasSubItems = true;
          break;
        }
        if (hasSubItems) break;

        const itemText = nextNumbered[2].trim();
        if (itemText) numberedItems.push(itemText);
        k++;
      }

      if (numberedItems.length > 0) blocks.push({ type: "numbered", items: numberedItems });
      i = k;
      continue;
    }

    // Ligne simple → text
    const cleanedLine = trimmed.replace(/^[-•]\s*/, "").trim();
    if (cleanedLine) blocks.push({ type: "text", text: cleanedLine });
    i++;
  }

  return blocks;
}
