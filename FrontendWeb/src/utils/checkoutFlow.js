const KEY = "lapstore_checkout_shipping_v1";

export const ORDER_SUCCESS_FLAG = "lapstore_order_success_v1";
/** Mã đơn từ server (hiển thị trang thành công) */
export const ORDER_SUCCESS_ORDER_CODE = "lapstore_last_order_code_v1";

export const PICKUP_STORES = [
  { id: "hcm-q1", label: "LAPSTORE Quận 1 — 123 Nguyễn Huệ, Q.1, TP.HCM" },
  { id: "hcm-q8", label: "LAPSTORE Quận 8 — 180 Cao Lỗ, Q.8, TPHCM" },
];

/** @typedef {{ fulfillment: 'pickup'|'delivery', pickupStoreId?: string, pickupName?: string, pickupPhone?: string, shipName?: string, shipPhone?: string, shipRegion?: string, shipAddress?: string }} ShippingPayload */

export function saveShippingDraft(payload) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function loadShippingDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? p : null;
  } catch {
    return null;
  }
}

export function clearShippingDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function storeLabel(id) {
  return PICKUP_STORES.find((s) => s.id === id)?.label ?? id ?? "";
}
