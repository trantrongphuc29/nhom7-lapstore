import { API_ENDPOINTS } from "../../../config/api";

function buildQuery(filters) {
  const params = new URLSearchParams();
  if (filters.brands?.length) params.append("brand", filters.brands.join(","));
  if (filters.cpu) params.append("cpu", filters.cpu);
  if (filters.ram) params.append("ram", filters.ram);
  if (filters.storage) params.append("storage", filters.storage);
  if (filters.priceRanges?.length) {
    params.append("priceRanges", filters.priceRanges.join(","));
  } else {
    if (filters.minPrice != null && filters.minPrice !== "") params.append("minPrice", filters.minPrice);
    if (filters.maxPrice != null && filters.maxPrice !== "") params.append("maxPrice", filters.maxPrice);
  }
  if (filters.keyword) params.append("keyword", filters.keyword);
  return params.toString();
}

function sortProducts(records, sort) {
  const result = [...records];
  switch (sort) {
    case "price-asc":
      result.sort((a, b) => a.min_price - b.min_price);
      break;
    case "price-desc":
      result.sort((a, b) => b.min_price - a.min_price);
      break;
    case "newest":
      result.sort((a, b) => b.id - a.id);
      break;
    default:
      break;
  }
  return result;
}

export async function getProductsByFilters(filters) {
  const query = buildQuery(filters);
  const url = query ? `${API_ENDPOINTS.PRODUCTS}?${query}` : API_ENDPOINTS.PRODUCTS;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  const payload = data?.data || data;
  const records = Array.isArray(payload.records) ? payload.records : [];
  return sortProducts(records, filters.sort);
}
