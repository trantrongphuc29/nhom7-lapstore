/** Dùng chung ProductDetail + Cart để hiển thị cấu hình ngắn */

export function shortenCpuLabel(cpu) {
  if (!cpu) return "";
  let s = cpu
    .replace(/^Intel\s+Core\s+/i, "")
    .replace(/^Intel\s+/i, "")
    .replace(/^AMD\s+Ryzen\s+/i, "Ryzen ")
    .replace(/^Apple\s+/i, "")
    .trim();
  s = s.replace(/^(i\d+)-/i, "$1 ");
  return s;
}

export function cpuLineForVariant(v, specs) {
  if (v?.version && String(v.version).trim()) {
    let s = String(v.version).trim();
    s = s.replace(/^(i\d+)-/i, "$1 ");
    return s;
  }
  return shortenCpuLabel(specs?.cpu || "");
}

export function screenPart(res, tech) {
  const t = tech?.trim();
  const r = res?.trim();
  if (t && t.length <= 32) return t;
  if (r) return r;
  return t || "";
}

export function buildVariantSummary(v, specs) {
  const parts = [
    cpuLineForVariant(v, specs),
    v?.ram || specs?.ram,
    v?.storage || specs?.storage,
    screenPart(specs?.screen_resolution, specs?.screen_technology),
  ].filter(Boolean);
  return parts.join(", ");
}
