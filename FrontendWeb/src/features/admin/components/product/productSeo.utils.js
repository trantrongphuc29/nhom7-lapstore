/** Domain trang bán hàng (canonical). */
export function getPublicSiteOrigin() {
  const env = typeof process !== "undefined" && process.env.REACT_APP_PUBLIC_SITE_URL;
  if (env && String(env).trim()) return String(env).trim().replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin.replace(/\/$/, "");
  return "";
}

export function buildProductCanonicalUrl(slug) {
  const base = getPublicSiteOrigin();
  const s = String(slug || "").trim();
  if (!base || !s) return "";
  return `${base}/products/${encodeURIComponent(s)}`;
}

export function slugifyProductName(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
