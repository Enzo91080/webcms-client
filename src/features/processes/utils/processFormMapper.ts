import type {
  ProcessFull,
  ObjectiveBlock,
  StakeholderLinkFields,
  ProcessStakeholder,
} from "../../../shared/types";
import type { ProcessStakeholderItem } from "../../../shared/api";
import type { StakeholderLinkData } from "../components";
import { normalizeDocs, parseObjectivesToBlocks } from "../../../shared/utils";

/**
 * Dérive les valeurs du formulaire AntD à partir d'un ProcessFull.
 */
export function deriveFormFromProcess(proc: ProcessFull) {
  const objectivesBlocks: ObjectiveBlock[] =
    Array.isArray(proc.objectivesBlocks) && proc.objectivesBlocks.length > 0
      ? proc.objectivesBlocks
      : typeof (proc as any).objectives === "string"
        ? parseObjectivesToBlocks((proc as any).objectives)
        : [];

  const pilotIds: string[] = Array.isArray((proc as any).pilotIds)
    ? (proc as any).pilotIds
    : Array.isArray(proc.pilots)
      ? proc.pilots.map((p: any) => p?.id).filter(Boolean)
      : [];

  const selectedStakeholderIds: string[] = Array.isArray((proc as any).stakeholderIds)
    ? (proc as any).stakeholderIds
    : Array.isArray(proc.stakeholders)
      ? proc.stakeholders.map((s: any) => s?.id).filter(Boolean)
      : [];

  const links: StakeholderLinkData[] = Array.isArray(proc.stakeholders)
    ? proc.stakeholders.map((s: ProcessStakeholder) => ({
      stakeholderId: s.id,
      name: s.name,
      isActive: s.isActive,
      needs: s.link?.needs ?? null,
      expectations: s.link?.expectations ?? null,
      evaluationCriteria: s.link?.evaluationCriteria ?? null,
      requirements: s.link?.requirements ?? null,
      strengths: s.link?.strengths ?? null,
      weaknesses: s.link?.weaknesses ?? null,
      opportunities: s.link?.opportunities ?? null,
      risks: s.link?.risks ?? null,
      actionPlan: s.link?.actionPlan ?? null,
    }))
    : [];

  return {
    formValues: {
      code: proc.code || "",
      name: proc.name || "",
      parentProcessId: proc.parentProcessId || "",
      orderInParent: proc.orderInParent ?? 1,
      isActive: Boolean(proc.isActive ?? true),
      processType: proc.processType || null,
      color: proc.color || null,
      title: (proc as any).title || "",
      objectivesBlocks,
      pilotIds,
      selectedStakeholderIds,
      referenceDocuments: normalizeDocs((proc as any).referenceDocuments),
    },
    stakeholderLinks: links,
    showAdvancedStakeholders: Boolean(proc.showAdvancedStakeholders),
  };
}

/**
 * Construit le payload API à partir des valeurs du formulaire + état stakeholders.
 */
export function buildPayloadFromForm(
  values: any,
  stakeholderLinks: StakeholderLinkData[],
  showAdvancedStakeholders: boolean
) {
  const payload = {
    code: String(values.code).trim(),
    name: String(values.name).trim(),
    parentProcessId: values.parentProcessId ? String(values.parentProcessId) : null,
    orderInParent: Number(values.orderInParent || 1),
    isActive: Boolean(values.isActive),
    processType: values.processType || null,
    color: values.color || null,
    title: String(values.title || ""),
    objectivesBlocks: Array.isArray(values.objectivesBlocks) ? values.objectivesBlocks : [],
    objectives: "", // clear legacy field to prevent stale re-parsing
    referenceDocuments: Array.isArray(values.referenceDocuments) ? values.referenceDocuments : [],
    showAdvancedStakeholders,
  };

  const pilotIds: string[] = Array.isArray(values.pilotIds) ? values.pilotIds : [];

  const stakeholderItems: ProcessStakeholderItem[] = stakeholderLinks.map((link) => ({
    stakeholderId: link.stakeholderId,
    needs: link.needs,
    expectations: link.expectations,
    evaluationCriteria: link.evaluationCriteria,
    requirements: link.requirements,
    strengths: link.strengths,
    weaknesses: link.weaknesses,
    opportunities: link.opportunities,
    risks: link.risks,
    actionPlan: link.actionPlan,
  }));

  return { payload, pilotIds, stakeholderItems };
}
