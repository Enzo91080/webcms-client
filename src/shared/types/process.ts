import type { LogiEdge, LogiNode } from "./logigramme";
import type { SipocRow } from "./sipoc";

export type ObjectiveBlock =
  | { type: "text"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] };

/**
 * Champs métier de la relation Process <-> Stakeholder.
 * Ces champs sont stockés dans la table de jointure process_stakeholders.
 */
export type StakeholderLinkFields = {
  needs?: string | null;
  expectations?: string | null;
  evaluationCriteria?: string | null;
  requirements?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  opportunities?: string | null;
  risks?: string | null;
  actionPlan?: string | null;
};

/**
 * Stakeholder avec les données de lien (link) pour un process donné.
 */
export type ProcessStakeholder = {
  id: string;
  name: string;
  isActive: boolean;
  link?: StakeholderLinkFields;
};

export type ProcessType = "internal" | "external";

export type CartographySlot =
  | "manager"
  | "value_chain"
  | "left_panel"
  | "right_panel"
  | "left_box"
  | "right_box";

export type ProcessLite = {
  parentProcessId: string | null;
  id: string;
  code: string;
  name: string;
  title?: string;
  orderInParent: number;
  isActive: boolean;
  processType?: ProcessType | null;
  color?: string | null;

  // Cartography (racines)
  cartographySlot?: CartographySlot | null;
  cartographyOrder?: number | null;
};

export type CartographyItem = {
  id: string;
  slotKey: CartographySlot;
  slotOrder: number;
  label: string | null;
  process: { id: string; code: string; name: string; color: string | null };
};

export type CartographyDTO = {
  manager: CartographyItem | null;
  valueChain: CartographyItem[];
  leftPanel: CartographyItem[];
  rightPanel: CartographyItem[];
  leftBox: CartographyItem[];
  rightBox: CartographyItem[];
};

export type PilotRef = {
  id: string;
  name: string;
  isActive?: boolean;
};

export type ProcessFull = ProcessLite & {
  parentProcessId: string | null;
  objectives?: string;
  objectivesBlocks?: ObjectiveBlock[];
  showAdvancedStakeholders?: boolean;
  stakeholders?: ProcessStakeholder[];
  stakeholderIds?: string[];
  pilotIds?: string[];
  pilots?: PilotRef[];
  referenceDocuments?: any;
  sipoc?: { rows: SipocRow[]; phases?: any[] };
  logigramme?: { 
    entryNodeId?: string; 
    nodes: LogiNode[]; 
    edges: LogiEdge[]; 
    legend?: any[] 
  };
  children?: ProcessLite[];
};

export type PathItem = {
  id: string;
  code: string;
  name: string;
  parentProcessId: string | null;
  orderInParent: number;
};
