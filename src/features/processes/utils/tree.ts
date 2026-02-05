import type { ProcessFull } from "../../../shared/types";

/**
 * Construit un arbre à partir d'une liste plate de processus.
 * - Injecte "children" par parentProcessId
 * - Trie par orderInParent puis code
 * - Supprime "children" vides (pour éviter une UI bruitée)
 */
export function buildProcessTree(items: ProcessFull[]): ProcessFull[] {
  const nodes = items.map((p) => ({ ...p, children: [] as ProcessFull[] }));
  const byId = new Map<string, ProcessFull>();
  nodes.forEach((n) => byId.set(n.id, n));

  const roots: ProcessFull[] = [];
  for (const n of nodes) {
    const parent = n.parentProcessId ? byId.get(n.parentProcessId) : null;
    if (parent) parent.children!.push(n);
    else roots.push(n);
  }

  const sortRec = (arr: ProcessFull[]) => {
    arr.sort((a, b) => {
      const oa = a.orderInParent ?? 9999;
      const ob = b.orderInParent ?? 9999;
      if (oa !== ob) return oa - ob;
      return String(a.code).localeCompare(String(b.code));
    });
    arr.forEach((x) => x.children?.length && sortRec(x.children));
  };

  const pruneEmptyChildren = (n: ProcessFull) => {
    if (!n.children || n.children.length === 0) {
      delete (n as any).children;
      return;
    }
    n.children.forEach(pruneEmptyChildren);
  };

  sortRec(roots);
  roots.forEach(pruneEmptyChildren);

  return roots;
}
