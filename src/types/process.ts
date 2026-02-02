import type { LogiEdge, LogiNode } from "./logigramme";
import type { SipocRow } from "./sipoc";

export type ProcessLite = {
  parentProcessId: string | null;
  id: string;
  code: string;
  name: string;
  title?: string;
  orderInParent: number;
  isActive: boolean;
};

export type ProcessFull = ProcessLite & {
  parentProcessId: string | null;
  objectives?: string;
  stakeholders?: any;
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
