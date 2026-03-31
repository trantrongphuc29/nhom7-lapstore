import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";

export async function getProductsForCompare(ids = []) {
  if (!Array.isArray(ids) || ids.length < 2) return [];
  const products = await Promise.all(
    ids.map((id) => getJson(API_ENDPOINTS.PRODUCT_DETAIL(id)).catch(() => null))
  );
  return products.map((item) => item?.data || item).filter((item) => item?.id);
}
