import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { adminListProcesses } from "../api";
import { getErrorMessage, formatProcessLabel } from "../utils";

export type ProcessOption = {
  id: string;
  code: string;
  name: string;
  processType?: string | null;
};

type SelectOption = {
  value: string;
  label: string;
};

type UseProcessOptionsResult = {
  /** Liste brute des processus (id, code, name) */
  processes: ProcessOption[];
  /** Options formatées pour Select antd */
  options: SelectOption[];
  /** Map id -> ProcessOption pour lookup rapide */
  byId: Map<string, ProcessOption>;
  /** État de chargement */
  loading: boolean;
  /** Recharger la liste */
  reload: () => Promise<void>;
};

/**
 * Hook pour charger les processus comme options de Select.
 * Fournit les données formatées pour les sélecteurs multi-processus.
 */
export function useProcessOptions(): UseProcessOptionsResult {
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListProcesses();
      const list = (res.data || []).map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        processType: p.processType || null,
      }));
      setProcesses(list);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const options = useMemo(
    () => processes.map((p) => ({ value: p.id, label: formatProcessLabel(p) })),
    [processes]
  );

  const byId = useMemo(
    () => new Map(processes.map((p) => [p.id, p])),
    [processes]
  );

  return { processes, options, byId, loading, reload };
}
