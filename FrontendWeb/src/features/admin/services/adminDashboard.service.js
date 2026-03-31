import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

export async function getAdminDashboardOverview(token) {
  const data = await getJson(API_ENDPOINTS.ADMIN_DASHBOARD, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data || {};
}
