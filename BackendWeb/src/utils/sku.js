/**
 * SKU — định danh duy nhất toàn hệ thống (product_admin_meta.sku & product_variants.sku).
 *
 * Gợi ý phiên bản — chuẩn compact 10 ký tự A–Z / 0–9 (không gạch), kiểu mã OEM:
 *   [Dòng 3][CPU/thế hệ 2][RAM+SSD 3 số][Màu 2]  → ví dụ: X1CG9037NU
 *
 * Phân tích ví dụ X1CG9037NU:
 *   X1C  = dòng máy (ThinkPad X1 Carbon / tương đương từ trường phiên bản)
 *   G9   = thế hệ / nhóm CPU (Gen 9, G-series, i7→I7, …)
 *   037  = mã cấu hình (RAM + dung lượng ổ, băm deterministic)
 *   NU   = mã màu / hậu tố 2 ký tự
 */

const SKU_MAX = 80;
const SKU_MIN = 3;

/** Độ dài SKU gợi ý compact (chuẩn cố định). */
const SUGGEST_COMPACT_LEN = 10;

function slugifyToken(input, maxLen = 12) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, maxLen);
}

function parseRamGb(ram) {
  const m = String(ram || "").match(/(\d+)/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? Math.min(128, n) : 0;
}

/** Dung lượng ổ tính bằng GB (TB → *1024). */
function parseStorageGb(storage) {
  const s = String(storage || "").toUpperCase();
  let m = s.match(/(\d+)\s*TB/i);
  if (m) return Math.min(8192, parseInt(m[1], 10) * 1024);
  m = s.match(/(\d+)\s*GB/i);
  if (m) return Math.min(8192, parseInt(m[1], 10));
  m = s.match(/(\d+)/);
  if (m) return Math.min(8192, parseInt(m[1], 10));
  return 0;
}

/** Khối 3 ký tự: dòng máy — ưu tiên nhận dạng từ version (X1 Carbon, T14, G16, M4, …). */
function seriesBlock3(brand, version) {
  const v = String(version || "").toUpperCase();
  const b = String(brand || "").toUpperCase();

  if (/X1\s*C|X1CARBON|CARBON\s*GEN/i.test(v)) return "X1C";
  if (/\bX1\b/i.test(v)) return "X1X";
  if (/T14/i.test(v)) return "T14";
  if (/T16/i.test(v)) return "T16";
  if (/G16|STRIX\s*G16|ROG\s*G16/i.test(v)) return "G16";
  if (/M4\s*PRO|M4PRO/i.test(v)) return "M4P";
  if (/\bM4\b/i.test(v)) return "M4X";
  if (/M3\s*PRO|M3PRO/i.test(v)) return "M3P";
  if (/\bM3\b/i.test(v)) return "M3X";
  if (/MACBOOK|MBA|MB AIR/i.test(v + b)) return "MBA";
  if (/MAC\s*PRO|MBP/i.test(v + b)) return "MBP";
  if (/\bAIR\b/i.test(v)) return "AIR";
  if (/\bPRO\b/i.test(v) && /MAC|APPLE/i.test(b + v)) return "MBP";

  const merged = slugifyToken(`${b} ${v}`, 12);
  if (merged.length >= 3) return merged.slice(0, 3);
  return (merged + "LAP").slice(0, 3);
}

/**
 * Khối 2 ký tự giữa SKU (kiểu OEM: G9, I7, …).
 * Ưu tiên thế hệ (Gen n) trước — khớp mã dạng X1C**G9**037…
 */
function cpuGenBlock2(version) {
  const v = String(version || "");

  let m = v.match(/Gen(?:eration)?\s*(\d{1,2})/i);
  if (m) {
    const g = parseInt(m[1], 10);
    const d = g % 10;
    return `G${d}`;
  }

  m = v.match(/\bI(\d)\b/i);
  if (m) return `I${m[1]}`;

  m = v.match(/Ultra\s*(\d)/i);
  if (m) return `U${m[1][0]}`;

  m = v.match(/Ryzen\s*(\d)/i);
  if (m) return `R${m[1][0]}`;

  m = v.match(/\bM(\d)\b/i);
  if (m) return `M${m[1]}`;

  m = v.match(/(\d{4})/);
  if (m) return `P${m[0].slice(-1)}`;

  return "G0";
}

/** 3 chữ số: cấu hình từ RAM (GB) + SSD (GB), ổn định theo input. */
function configDigits3(ram, storage) {
  const r = parseRamGb(ram) || 8;
  const s = parseStorageGb(storage) || 256;
  const n = (r * 37 + s * 7 + 13) % 1000;
  return String(n).padStart(3, "0");
}

/** 2 ký tự màu: map tiếng Việt / ASCII; không có màu → 2 chữ cái từ product/variant id. */
function colorBlock2(color, productId = null, variantId = null) {
  const raw = String(color || "").trim();
  const u = raw.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (!raw) {
    const A = "ABCDEFGHJKLMNPRSTUVWXYZ";
    const pid = Number(productId) || 0;
    const vid = Number(variantId) || 0;
    const h = (pid * 7919 + vid * 6997 + 13) % (A.length * A.length);
    return A[h % A.length] + A[Math.floor(h / A.length) % A.length];
  }

  if (/\bDEN\b|ĐEN|BLACK/i.test(u)) return "DE";
  if (/\bBAC\b|BẠC|SILVER|PLATINUM/i.test(u)) return "BA";
  if (/XAM|XÁM|GRAY|GREY/i.test(u)) return "XA";
  if (/XANH|BLUE/i.test(u)) return "XN";
  if (/DO|ĐỎ|RED/i.test(u)) return "DO";
  if (/VANG|VÀNG|GOLD/i.test(u)) return "VA";
  if (/TRANG|TRẮNG|WHITE/i.test(u)) return "TR";
  if (/TIM|TÍM|PURPLE/i.test(u)) return "TU";
  if (/NATURAL|NATURE|NAT\b/i.test(u)) return "NU";

  const t = slugifyToken(color, 8);
  if (t.length >= 2) return t.slice(0, 2);
  return `${t}X`.slice(0, 2);
}

/**
 * SKU phiên bản compact 10 ký tự — chuẩn kiểu X1CG9037NU.
 * productId / variantId chỉ dùng khi thiếu màu để tránh trùng cục bộ (vẫn kiểm tra DB ở service).
 */
function suggestVariantSku({
  brand = "",
  version = "",
  ram = "",
  storage = "",
  color = "",
  productId = null,
  variantId = null,
} = {}) {
  const ser = seriesBlock3(brand, version);
  const cpu = cpuGenBlock2(version);
  const ddd = configDigits3(ram, storage);
  const cc = colorBlock2(color, productId, variantId);

  let code = `${ser}${cpu}${ddd}${cc}`.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < SUGGEST_COMPACT_LEN) {
    code = (code + "0000000000").slice(0, SUGGEST_COMPACT_LEN);
  }
  if (code.length > SUGGEST_COMPACT_LEN) {
    code = code.slice(0, SUGGEST_COMPACT_LEN);
  }
  return code;
}

function normalizeSku(raw) {
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
}

function validateSkuFormat(raw) {
  const s = normalizeSku(raw);
  if (!s) return "SKU là bắt buộc cho mỗi phiên bản";
  if (s.length < SKU_MIN) return `SKU tối thiểu ${SKU_MIN} ký tự`;
  if (s.length > SKU_MAX) return `SKU tối đa ${SKU_MAX} ký tự`;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s)) {
    return "SKU chỉ gồm chữ/số và ký tự . _ - (bắt đầu bằng chữ hoặc số)";
  }
  return null;
}

/**
 * SKU mức sản phẩm (admin meta): compact, không gạch — HÃNG + TÊN rút gọn + 4 số.
 */
function suggestProductSku(name = "", brand = "") {
  const B = slugifyToken(brand, 4) || "PRD";
  const N = slugifyToken(name.replace(/laptop/gi, ""), 6) || "ITEM";
  const stamp = Date.now().toString().slice(-4);
  let s = `${B}${N}${stamp}`.replace(/[^A-Z0-9]/g, "").toUpperCase();
  if (s.length > 16) s = s.slice(0, 16);
  if (s.length < 8) s = (s + "X0000000").slice(0, 10);
  return s;
}

module.exports = {
  normalizeSku,
  validateSkuFormat,
  suggestVariantSku,
  suggestProductSku,
  SKU_MAX,
  SKU_MIN,
  SUGGEST_COMPACT_LEN,
};
