import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

function headers(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function getAdminCustomers(params, token) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== "" && v != null) query.append(k, v);
  });
  const res = await getJson(`${API_ENDPOINTS.ADMIN_CUSTOMERS}?${query.toString()}`, { headers: headers(token) });
  return res.data || {};
}

export async function getAdminCustomerDetail(id, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_CUSTOMER_DETAIL(id), { headers: headers(token) });
  return res.data || {};
}

export async function updateAdminCustomerStatus(id, payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_CUSTOMER_STATUS(id), {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  return res.data || {};
}
