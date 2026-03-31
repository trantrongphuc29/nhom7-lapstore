import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function postPricingPreview(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PRICING_PREVIEW, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload || {}),
  });
  return res.data || {};
}

export async function getPricingSettings(token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PRICING_SETTINGS, {
    headers: authHeaders(token),
  });
  return res.data || {};
}

export async function patchPricingSettings(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PRICING_SETTINGS, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload || {}),
  });
  return res.data || {};
}
