/** Event khi API trả 401 cho request có Bearer token — AuthProvider lắng nghe để xóa phiên. */
export const AUTH_UNAUTHORIZED_EVENT = "lapstore:auth-unauthorized";

/** Chuẩn hóa token từ localStorage / state — tránh "undefined", chuỗi rỗng, JWT không đủ 3 phần. */
export function sanitizeStoredToken(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s || s === "undefined" || s === "null") return "";
  const parts = s.split(".");
  if (parts.length !== 3) return "";
  return s;
}

function requestHadAuthorization(options) {
  const h = options?.headers;
  if (!h) return false;
  if (typeof h.get === "function") return Boolean(h.get("Authorization"));
  return Boolean(h.Authorization);
}

export function notifyUnauthorizedSession(response, options) {
  if (typeof window === "undefined") return;
  if (!response || response.status !== 401) return;
  if (!requestHadAuthorization(options)) return;
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}
