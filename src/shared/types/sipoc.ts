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
  processusFournisseur?: string | string[];
  entrees?: string;
  ressources?: string;
  // RACI fields (admin mode)
  raciR?: string;
  raciA?: string;
  raciC?: string;
  raciI?: string;
  designation?: Designation;
  sorties?: string;
  processusClient?: string | string[];

  // Nouveau format
  designationProcessus?: Designation;
  activitePhase?: Designation;
  sortiesProcessus?: string;
  designationProcessusClient?: string | string[];
  sortiesProcessusClient?: string;
};

export type SipocPhase = {
  key?: string;
  name?: string;
  rows?: SipocRow[];
};
