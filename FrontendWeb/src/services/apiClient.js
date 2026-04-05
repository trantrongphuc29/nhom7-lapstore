import { notifyUnauthorizedSession } from "../utils/authSession";

async function parseJsonResponse(response, options) {
  notifyUnauthorizedSession(response, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  return parseJsonResponse(response, options);
}

export async function patchJson(url, body, options = {}) {
  const fetchOpts = {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: JSON.stringify(body ?? {}),
  };
  const response = await fetch(url, fetchOpts);
  return parseJsonResponse(response, fetchOpts);
}

export async function postJson(url, body, options = {}) {
  const fetchOpts = {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options.headers },
    body: JSON.stringify(body ?? {}),
  };
  const response = await fetch(url, fetchOpts);
  return parseJsonResponse(response, fetchOpts);
}
