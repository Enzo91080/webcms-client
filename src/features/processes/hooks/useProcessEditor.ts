import { useState } from "react";
import type { FormInstance } from "antd";
import { message } from "antd";

import type { ProcessFull } from "../../../shared/types";
import type { StakeholderLinkData } from "../components";
import {
  adminCreateProcess,
  adminDeleteProcess,
  adminGetProcess,
  adminPatchProcess,
  adminSetProcessPilots,
  adminSetProcessStakeholders,
} from "../../../shared/api";
import { getErrorMessage } from "../../../shared/utils";
import { deriveFormFromProcess, buildPayloadFromForm } from "../utils/processFormMapper";

interface UseProcessEditorArgs {
  form: FormInstance;
  reload: () => Promise<void>;
  stakeholderLinks: StakeholderLinkData[];
  setStakeholderLinks: (links: StakeholderLinkData[]) => void;
  showAdvancedStakeholders: boolean;
  setShowAdvancedStakeholders: (v: boolean) => void;
}

export function useProcessEditor({
  form,
  reload,
  stakeholderLinks,
  setStakeholderLinks,
  showAdvancedStakeholders,
  setShowAdvancedStakeholders,
}: UseProcessEditorArgs) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessFull | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  function openCreate() {
    setEditing(null);
    setActiveTab("general");
    setStakeholderLinks([]);
    setShowAdvancedStakeholders(false);
    setOpen(true);

    form.resetFields();
    form.setFieldsValue({
      code: "",
      name: "",
      parentProcessId: "",
      orderInParent: 1,
      isActive: true,
      processType: null,
      title: "",
      objectivesBlocks: [],
      selectedStakeholderIds: [],
      pilotIds: [],
      referenceDocuments: [],
    });
  }

  async function openEdit(p: ProcessFull) {
    setEditing(p);
    setActiveTab("general");
    setOpen(true);

    const lite = deriveFormFromProcess(p);
    setStakeholderLinks(lite.stakeholderLinks);
    setShowAdvancedStakeholders(lite.showAdvancedStakeholders);

    form.resetFields();
    form.setFieldsValue(lite.formValues);

    try {
      const full = await adminGetProcess(p.id);
      const proc = full.data as ProcessFull;
      setEditing(proc);

      const hydrated = deriveFormFromProcess(proc);
      setStakeholderLinks(hydrated.stakeholderLinks);
      setShowAdvancedStakeholders(hydrated.showAdvancedStakeholders);
      form.setFieldsValue(hydrated.formValues);
    } catch (e) {
      console.warn(e);
    }
  }

  async function saveBase() {
    try {
      const v = await form.validateFields();
      const { payload, pilotIds, stakeholderItems } = buildPayloadFromForm(
        v,
        stakeholderLinks,
        showAdvancedStakeholders
      );

      if (!payload.code || !payload.name) throw new Error("code et name sont obligatoires");

      // CREATE
      if (!editing?.id) {
        const createRes = await adminCreateProcess(payload);
        const createdId = createRes.data?.id;

        if (createdId) {
          await adminSetProcessPilots(createdId, pilotIds);
          await adminSetProcessStakeholders(createdId, stakeholderItems);
        }

        message.success("Processus créé");
        setOpen(false);
        await reload();
        return;
      }

      // UPDATE
      await adminPatchProcess(editing.id, payload);
      await adminSetProcessPilots(editing.id, pilotIds);
      await adminSetProcessStakeholders(editing.id, stakeholderItems);

      message.success("Processus enregistré");
      await reload();

      try {
        const full = await adminGetProcess(editing.id);
        setEditing(full.data as ProcessFull);
      } catch {
        // silent
      }
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  async function doDelete(p: ProcessFull) {
    try {
      await adminDeleteProcess(p.id);
      message.success("Supprimé");
      if (editing?.id === p.id) setOpen(false);
      await reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  }

  return {
    open,
    setOpen,
    editing,
    setEditing,
    activeTab,
    setActiveTab,
    openCreate,
    openEdit,
    saveBase,
    doDelete,
  };
}
