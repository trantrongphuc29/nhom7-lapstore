export function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === "";
}

export function toNumber(v) {
  if (v === null || v === undefined) return NaN;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : NaN;
}

export function validatePercent(value, { min = 0, max = 100 } = {}) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "Phải là số";
  if (n < min || n > max) return `Phải trong khoảng ${min}–${max}`;
  return "";
}

export function validateMoney(value, { min = 0 } = {}) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "Phải là số";
  if (n < min) return `Không được nhỏ hơn ${min}`;
  return "";
}

export function validatePositiveInt(value, { min = 1 } = {}) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "Phải là số";
  if (!Number.isInteger(n)) return "Phải là số nguyên";
  if (n < min) return `Không được nhỏ hơn ${min}`;
  return "";
}

// Accept common SKU: letters/digits + separators: - _ .
export function validateSku(value) {
  if (isBlank(value)) return "SKU là bắt buộc";
  const v = String(value).trim();
  if (v.length < 3) return "SKU quá ngắn";
  if (v.length > 80) return "SKU quá dài";
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v)) return "SKU chỉ gồm chữ/số và ký tự . _ -";
  return "";
}

// Serial: allow letters/digits and - _ . / (common for device serials)
export function validateSerialOne(value) {
  if (isBlank(value)) return "Serial là bắt buộc";
  const v = String(value).trim();
  if (v.length < 4) return "Serial quá ngắn";
  if (v.length > 128) return "Serial quá dài";
  if (!/^[A-Za-z0-9][A-Za-z0-9._\-/]*$/.test(v)) return "Serial chỉ gồm chữ/số và ký tự . _ - /";
  return "";
}

export function parseSerialList(serialStr) {
  if (isBlank(serialStr)) return [];
  // Support both pipe and comma separation.
  return String(serialStr)
    .split(/[|,]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateSerialList(serialStr, { expectedCount } = {}) {
  if (isBlank(serialStr)) return expectedCount ? "Thiếu serial" : "";
  const list = parseSerialList(serialStr);
  if (list.length === 0) return expectedCount ? "Thiếu serial" : "";
  const unique = new Set(list);
  if (unique.size !== list.length) return "Serial bị trùng (trong cùng dòng)";
  for (const s of list) {
    const err = validateSerialOne(s);
    if (err) return err;
  }
  if (expectedCount && list.length !== expectedCount) return `Cần đúng ${expectedCount} serial`;
  return "";
}

export function validateIsoDate(value) {
  if (isBlank(value)) return "Ngày là bắt buộc";
  const v = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Sai định dạng YYYY-MM-DD";
  const t = Date.parse(v);
  if (Number.isNaN(t)) return "Ngày không hợp lệ";
  return "";
}

