import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

function headers(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getAdminAuditLogs(params, token) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== "" && v != null) query.append(k, v);
  });
  const res = await getJson(`${API_ENDPOINTS.ADMIN_AUDIT_LOGS}?${query.toString()}`, { headers: headers(token) });
  return res.data || {};
}
