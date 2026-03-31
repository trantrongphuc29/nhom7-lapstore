import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

function headers(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function getAdminPromotions(token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PROMOTIONS, { headers: headers(token) });
  return res.data || {};
}

export async function createAdminVoucher(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PROMOTION_VOUCHERS, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function updateAdminVoucher(id, payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PROMOTION_VOUCHER_DETAIL(id), {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function deleteAdminVoucher(id, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_PROMOTION_VOUCHER_DETAIL(id), {
    method: "DELETE",
    headers: headers(token),
  });
  return res.data || {};
}
