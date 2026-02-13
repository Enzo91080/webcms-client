import { useState } from "react";
import type { FormInstance } from "antd";
import type { StakeholderLinkFields } from "../../../shared/types";
import type { StakeholderLinkData } from "../components";

interface StakeholdersById {
  get(id: string): { name: string; isActive: boolean } | undefined;
}

export function useStakeholderLinks(form: FormInstance, stakeholdersById: StakeholdersById) {
  const [stakeholderLinks, setStakeholderLinks] = useState<StakeholderLinkData[]>([]);
  const [showAdvancedStakeholders, setShowAdvancedStakeholders] = useState(false);

  function handleStakeholderSelection(selectedIds: string[]) {
    const currentIds = new Set(stakeholderLinks.map((l) => l.stakeholderId));
    const newIds = new Set(selectedIds);

    const kept = stakeholderLinks.filter((l) => newIds.has(l.stakeholderId));

    const added: StakeholderLinkData[] = selectedIds
      .filter((id) => !currentIds.has(id))
      .map((id) => {
        const s = stakeholdersById.get(id);
        return {
          stakeholderId: id,
          name: s?.name || "?",
          isActive: s?.isActive ?? true,
          needs: null,
          expectations: null,
          evaluationCriteria: null,
          requirements: null,
          strengths: null,
          weaknesses: null,
          opportunities: null,
          risks: null,
          actionPlan: null,
        };
      });

    setStakeholderLinks([...kept, ...added]);
    form.setFieldsValue({ selectedStakeholderIds: selectedIds });
  }

  function updateLinkField(
    stakeholderId: string,
    field: keyof StakeholderLinkFields,
    value: string | null
  ) {
    setStakeholderLinks((prev) =>
      prev.map((l) =>
        l.stakeholderId === stakeholderId ? { ...l, [field]: value || null } : l
      )
    );
  }

  return {
    stakeholderLinks,
    setStakeholderLinks,
    showAdvancedStakeholders,
    setShowAdvancedStakeholders,
    handleStakeholderSelection,
    updateLinkField,
  };
}
