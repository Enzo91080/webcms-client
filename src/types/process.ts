import type { LogiEdge, LogiNode } from "./logigramme";
import type { SipocRow } from "./sipoc";

export type ObjectiveBlock =
  | { type: "text"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered"; items: string[] };

export type ProcessLite = {
  parentProcessId: string | null;
  id: string;
  code: string;
  name: string;
  title?: string;
  orderInParent: number;
  isActive: boolean;
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
  stakeholders?: any;
  pilotIds?: string[];
  pilots?: PilotRef[];
  referenceDocuments?: any;
  sipoc?: { rows: SipocRow[]; phases?: any[] };
  logigramme?: { entryNodeId?: string; nodes: LogiNode[]; edges: LogiEdge[]; legend?: any[] };
  children?: ProcessLite[];
};

export type PathItem = {
  id: string;
  code: string;
  name: string;
  parentProcessId: string | null;
  orderInParent: number;
};
