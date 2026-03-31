import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getAdminBrands(token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_BRANDS, { headers: authHeaders(token) });
  return res.data?.records || [];
}

export async function getAdminCategories(token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_CATEGORIES, { headers: authHeaders(token) });
  return res.data?.records || [];
}

export async function createAdminBrand(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_BRANDS, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function updateAdminBrand(id, payload, token) {
  const res = await getJson(`${API_ENDPOINTS.ADMIN_BRANDS}/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function deleteAdminBrand(id, token) {
  const res = await getJson(`${API_ENDPOINTS.ADMIN_BRANDS}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return res.data || {};
}

export async function createAdminCategory(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_CATEGORIES, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function updateAdminCategory(id, payload, token) {
  const res = await getJson(`${API_ENDPOINTS.ADMIN_CATEGORIES}/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.data || {};
}
