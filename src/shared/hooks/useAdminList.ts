import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import {
  adminListProcesses,
  adminListPilots,
  adminListStakeholders,
} from "../api";
import type { ProcessFull } from "../types";
import { getErrorMessage } from "../utils";

type Pilot = {
  id: string;
  name: string;
  isActive: boolean;
  processIds?: string[];
};

type Stakeholder = {
  id: string;
  name: string;
  isActive: boolean;
  processIds?: string[];
  processes?: any[];
};

type UseAdminListResult<T> = {
  items: T[];
  loading: boolean;
  reload: () => Promise<void>;
};

/**
 * Hook générique pour charger une liste admin.
 */
function useAdminList<T>(
  fetcher: () => Promise<{ data: T[] }>,
  showError = true
): UseAdminListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetcher();
      setItems((res.data || []) as T[]);
    } catch (e) {
      if (showError) {
        message.error(getErrorMessage(e));
      }
      console.warn("useAdminList error:", e);
    } finally {
      setLoading(false);
    }
  }, [fetcher, showError]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}

/**
 * Hook pour charger la liste des processus admin.
 */
export function useAdminProcesses(): UseAdminListResult<ProcessFull> {
  return useAdminList<ProcessFull>(adminListProcesses as any);
}

/**
 * Hook pour charger la liste des pilotes admin.
 */
export function useAdminPilots(): UseAdminListResult<Pilot> {
  return useAdminList<Pilot>(adminListPilots as any);
}

/**
 * Hook pour charger la liste des stakeholders admin.
 */
export function useAdminStakeholders(): UseAdminListResult<Stakeholder> {
  return useAdminList<Stakeholder>(adminListStakeholders as any);
}
