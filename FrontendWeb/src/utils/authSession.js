/** Event khi API trả 401 cho request có Bearer token — AuthProvider lắng nghe để xóa phiên. */
export const AUTH_UNAUTHORIZED_EVENT = "lapstore:auth-unauthorized";

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
