// API client
export { request, setTokenGetter } from "./client";

// Auth API
export { login, me, getToken, setToken, clearToken } from "./auth.api";

// Process API
export {
  getCartography,
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
} from "./process.api";

// Stakeholders API
export {
  adminListStakeholders,
  adminCreateStakeholder,
  adminPatchStakeholder,
  adminDeleteStakeholder,
  type Stakeholder,
} from "./stakeholders.api";

// SIPOC Admin API
export {
  adminGetSipoc,
  adminUpsertSipoc,
  type AdminSipocResponse,
} from "./sipoc.api";
