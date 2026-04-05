import { API_ENDPOINTS } from "../../../config/api";
import { getJson } from "../../../services/apiClient";
import { notifyUnauthorizedSession } from "../../../utils/authSession";

function headers(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function parseFileNameFromDisposition(disposition) {
  const raw = String(disposition || "");
  const utf8Match = raw.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
  const normalMatch = raw.match(/filename\s*=\s*("?)([^";]+)\1/i);
  if (normalMatch?.[2]) return normalMatch[2].trim();
  return "";
}

export async function postExcelImport(payload, token) {
  const res = await getJson(API_ENDPOINTS.ADMIN_EXCEL_IMPORT, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  return res.data || {};
}

export async function downloadExcelTemplate(type, token) {
  const url = API_ENDPOINTS.ADMIN_EXCEL_TEMPLATE(type);
  const opts = { headers: { Authorization: `Bearer ${token}` } };
  const res = await fetch(url, opts);
  notifyUnauthorizedSession(res, opts);
  if (!res.ok) throw new Error("Không tải được file mẫu");
  const blob = await res.blob();
  const serverName = parseFileNameFromDisposition(res.headers.get("content-disposition"));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = serverName || `mau-${type}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function downloadReportExcel(report, token, extra = {}) {
  const q = new URLSearchParams({ report, ...extra });
  const url = `${API_ENDPOINTS.ADMIN_REPORT_EXPORT}?${q.toString()}`;
  const opts = { headers: { Authorization: `Bearer ${token}` } };
  const res = await fetch(url, opts);
  notifyUnauthorizedSession(res, opts);
  if (!res.ok) throw new Error("Không tải được báo cáo");
  const blob = await res.blob();
  const serverName = parseFileNameFromDisposition(res.headers.get("content-disposition"));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = serverName || `bao-cao-${report}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
