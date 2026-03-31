import { API_ENDPOINTS } from "../config/api";

/**
 * @param {object} body items, shipping, paymentMethod, voucherCode?
 * @param {string|null} token Bearer khi đã đăng nhập (guest: null)
 */
export async function createStorefrontOrder(body, token) {
  const res = await fetch(API_ENDPOINTS.ORDERS_CREATE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || `Đặt hàng thất bại (${res.status})`);
  }
  return data?.data ?? data;
}
