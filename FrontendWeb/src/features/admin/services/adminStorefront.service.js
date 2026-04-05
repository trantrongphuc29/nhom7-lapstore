import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function getStorefrontSettings(token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_STOREFRONT_SETTINGS, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data || {};
}

export async function patchStorefrontSettings(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_STOREFRONT_SETTINGS, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload || {}),
  });
  return res.data || {};
}
