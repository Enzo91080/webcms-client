import { request } from "./client";

export async function login(email: string, password: string) {
  return request<{ data: { token: string; user: any } }>(`/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function me() {
  return request<{ data: { user: any } }>(`/api/auth/me`);
}

// Token storage
const TOKEN_KEY = "pm_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
