export type DesignationTarget =
  | { type: "url"; url: string }
  | { type: "process"; processId: string };

export type Designation = {
  name?: string;
  url?: string;
  target?: DesignationTarget;
};

export type SipocRow = {
  ref?: string;
  phase?: string;
  numero?: string | number;
  processusFournisseur?: string;
  entrees?: string;
  ressources?: string;
  designation?: Designation;
  sorties?: string;
  processusClient?: string;

  // Nouveau format
  designationProcessusVendre?: Designation;
  activitePhase?: Designation;
  sortiesProcessusVendre?: string;
  designationProcessusClient?: string;
  sortiesProcessusClient?: string;
};

export type SipocPhase = {
  key?: string;
  name?: string;
  rows?: SipocRow[];
};
