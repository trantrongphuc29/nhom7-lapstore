import { API_ENDPOINTS, BACKEND_BASE_URL } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

export async function getActiveBanners() {
  const data = await getJson(API_ENDPOINTS.BANNERS);
  const payload = data?.data || data;
  const records = Array.isArray(payload.records) ? payload.records : [];
  return records.map((banner) => ({
    ...banner,
    image: banner.image?.startsWith("http")
      ? banner.image
      : `${BACKEND_BASE_URL}/${banner.image}`,
  }));
}
