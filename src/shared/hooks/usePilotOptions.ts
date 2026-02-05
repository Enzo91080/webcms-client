import { useCallback, useEffect, useMemo, useState } from "react";
import { adminListPilots } from "../api";

type PilotOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type SelectOption = {
  value: string;
  label: string;
};

type UsePilotOptionsResult = {
  /** Liste brute des pilotes actifs */
  pilots: PilotOption[];
  /** Options formatées pour Select antd */
  options: SelectOption[];
  /** Map id -> PilotOption pour lookup rapide */
  byId: Map<string, PilotOption>;
  /** État de chargement */
  loading: boolean;
  /** Recharger la liste */
  reload: () => Promise<void>;
};

/**
 * Hook pour charger les pilotes comme options de Select.
 * Filtre automatiquement pour ne garder que les pilotes actifs.
 */
export function usePilotOptions(): UsePilotOptionsResult {
  const [pilots, setPilots] = useState<PilotOption[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListPilots();
      const list = (res.data || [])
        .filter((p: any) => p.isActive)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          isActive: p.isActive,
        }));
      setPilots(list);
    } catch (e) {
      console.warn("Failed to load pilots", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const options = useMemo(
    () => pilots.map((p) => ({ value: p.id, label: p.name })),
    [pilots]
  );

  const byId = useMemo(
    () => new Map(pilots.map((p) => [p.id, p])),
    [pilots]
  );

  return { pilots, options, byId, loading, reload };
}
