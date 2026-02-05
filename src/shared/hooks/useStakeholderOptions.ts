import { useCallback, useEffect, useMemo, useState } from "react";
import { adminListStakeholders } from "../api";

type StakeholderOption = {
  id: string;
  name: string;
  isActive: boolean;
};

type SelectOption = {
  value: string;
  label: string;
};

type UseStakeholderOptionsResult = {
  /** Liste brute des stakeholders actifs */
  stakeholders: StakeholderOption[];
  /** Options formatées pour Select antd */
  options: SelectOption[];
  /** Map id -> StakeholderOption pour lookup rapide */
  byId: Map<string, StakeholderOption>;
  /** État de chargement */
  loading: boolean;
  /** Recharger la liste */
  reload: () => Promise<void>;
};

/**
 * Hook pour charger les stakeholders comme options de Select.
 * Filtre automatiquement pour ne garder que les stakeholders actifs.
 */
export function useStakeholderOptions(): UseStakeholderOptionsResult {
  const [stakeholders, setStakeholders] = useState<StakeholderOption[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListStakeholders();
      const list = (res.data || [])
        .filter((s: any) => s.isActive)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          isActive: s.isActive,
        }));
      setStakeholders(list);
    } catch (e) {
      console.warn("Failed to load stakeholders", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const options = useMemo(
    () => stakeholders.map((s) => ({ value: s.id, label: s.name })),
    [stakeholders]
  );

  const byId = useMemo(
    () => new Map(stakeholders.map((s) => [s.id, s])),
    [stakeholders]
  );

  return { stakeholders, options, byId, loading, reload };
}
