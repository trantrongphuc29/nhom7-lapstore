import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";
import { notifyUnauthorizedSession } from "../../../utils/authSession";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function getAdminSkuSuggest(params, token) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== "" && value != null) query.append(key, value);
  });
  const url = `${API_ENDPOINTS.ADMIN_PRODUCT_SKU_SUGGEST}?${query.toString()}`;
  const res = await getJson(url, { headers: authHeaders(token) });
  return res.data || {};
}

export async function getAdminProducts(params, token) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== "" && value != null) query.append(key, value);
  });
  const url = `${API_ENDPOINTS.ADMIN_PRODUCTS}?${query.toString()}`;
  const res = await getJson(url, { headers: authHeaders(token) });
  return res.data || {};
}

export async function createAdminProduct(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PRODUCTS, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function getAdminProductDetail(id, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PRODUCT_DETAIL(id), {
    headers: authHeaders(token),
  });
  return res.data || {};
}

export async function updateAdminProduct(id, payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PRODUCT_DETAIL(id), {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function bulkUpdateAdminProductStatus(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PRODUCTS_BULK_STATUS, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function bulkDeleteAdminProducts(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PRODUCTS_BULK_DELETE, {
    method: "DELETE",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function uploadAdminProductImages(files, token, productName = "") {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  if (productName) formData.append("productName", productName);
  const uploadOpts = {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  };
  const response = await fetch(API_ENDPOINTS.ADMIN_UPLOAD_IMAGES, uploadOpts);
  notifyUnauthorizedSession(response, uploadOpts);
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Upload failed");
  }
  return data?.data?.records || [];
}
