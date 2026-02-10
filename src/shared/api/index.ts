// API client
export { request, setTokenGetter } from "./client";

// Auth API
export { login, me, getToken, setToken, clearToken } from "./auth.api";

// Process API
export {
  getCartography,
  getProcessListLite,
  getProcessByCode,
  getPath,
  resolveCodes,
  resolveIdByCode,
  saveSipoc,
  saveLogigramme,
  adminListProcesses,
  adminGetProcess,
  adminCreateProcess,
  adminPatchProcess,
  adminDeleteProcess,
  adminSetProcessPilots,
  adminSetProcessStakeholders,
  type ProcessStakeholderItem,
} from "./process.api";

// Stakeholders API
export {
  adminListStakeholders,
  adminCreateStakeholder,
  adminPatchStakeholder,
  adminDeleteStakeholder,
  adminSetStakeholderProcesses,
  type Stakeholder,
  type ProcessWithLink,
  type StakeholderProcessItem,
} from "./stakeholders.api";

// Pilots API
export {
  adminListPilots,
  adminCreatePilot,
  adminPatchPilot,
  adminDeletePilot,
  adminSetPilotProcesses,
  type Pilot,
} from "./pilots.api";

// SIPOC Admin API
export {
  adminGetSipoc,
  adminUpsertSipoc,
  type AdminSipocResponse,
} from "./sipoc.api";

// Cartography Admin API
export {
  adminGetCartography,
  adminSaveCartography,
  type CartographyLayoutInput,
} from "./cartography.api";
