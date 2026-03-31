import { API_ENDPOINTS } from "../config/api";

async function parseJsonResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const msg = data?.message || `Yêu cầu thất bại (${res.status})`;
    throw new Error(msg);
  }
  return data?.data ?? data;
}

/** Kiểm tra mã — không tăng used_count */
export async function previewVoucher(code, subtotal) {
  const res = await fetch(API_ENDPOINTS.VOUCHER_PREVIEW, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: String(code || "").trim(), subtotal: Number(subtotal) || 0 }),
  });
  return parseJsonResponse(res);
}

/** Hoàn tất đặt hàng — tăng used_count */
export async function redeemVoucher(code, subtotal) {
  const res = await fetch(API_ENDPOINTS.VOUCHER_REDEEM, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: String(code || "").trim(), subtotal: Number(subtotal) || 0 }),
  });
  return parseJsonResponse(res);
}
