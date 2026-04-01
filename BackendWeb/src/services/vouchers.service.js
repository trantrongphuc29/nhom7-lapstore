const pool = require("../../config/database");
const AppError = require("../utils/AppError");

function normalizeCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function computeDiscountAmount(row, subtotal) {
  const s = Number(subtotal) || 0;
  const minOrder = Number(row.min_order_value || 0);
  if (s < minOrder) {
    return {
      ok: false,
      message: `Đơn hàng chưa đạt giá trị tối thiểu để sử dụng.`,
    };
  }
  const dtype = row.discount_type;
  const val = Number(row.discount_value);
  let amount = 0;
  if (dtype === "percent") {
    amount = Math.floor((s * val) / 100);
  } else {
    amount = Math.floor(val);
  }
  amount = Math.min(Math.max(0, amount), s);
  return { ok: true, discountAmount: amount };
}

function validateWindow(row) {
  const now = new Date();
  if (row.starts_at) {
    const st = new Date(row.starts_at);
    if (now < st) return "Mã chưa có hiệu lực.";
  }
  if (row.ends_at) {
    const en = new Date(row.ends_at);
    if (now > en) return "Mã đã hết hạn.";
  }
  return null;
}

function assertRowApplicable(row, subtotal) {
  if (!row) {
    throw new AppError("Không tìm thấy mã khuyến mãi.", 404, "VOUCHER_NOT_FOUND");
  }
  if (!row.is_active) {
    throw new AppError("Mã này không còn hoạt động.", 400, "VOUCHER_INACTIVE");
  }
  const winErr = validateWindow(row);
  if (winErr) throw new AppError(winErr, 400, "VOUCHER_EXPIRED");
  const limit = Number(row.usage_limit || 0);
  const used = Number(row.used_count || 0);
  if (limit > 0 && used >= limit) {
    throw new AppError("Mã đã hết lượt sử dụng.", 400, "VOUCHER_EXHAUSTED");
  }
  const calc = computeDiscountAmount(row, subtotal);
  if (!calc.ok) {
    throw new AppError(calc.message, 400, "VOUCHER_MIN_ORDER");
  }
  return calc.discountAmount;
}

async function getVoucherRowByCode(codeNormalized) {
  if (!codeNormalized) return null;
  const [[row]] = await pool.query(`SELECT * FROM vouchers WHERE code = ? LIMIT 1`, [codeNormalized]);
  return row || null;
}

async function previewVoucher(rawCode, subtotal) {
  const c = normalizeCode(rawCode);
  if (!c) throw new AppError("Vui lòng nhập mã voucher.", 400, "VALIDATION_ERROR");
  const sub = Number(subtotal);
  if (!Number.isFinite(sub) || sub < 0) {
    throw new AppError("Tạm tính không hợp lệ.", 400, "VALIDATION_ERROR");
  }
  const row = await getVoucherRowByCode(c);
  const discountAmount = assertRowApplicable(row, sub);
  return {
    code: row.code,
    discountAmount,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderValue: Number(row.min_order_value || 0),
  };
}

async function redeemVoucher(rawCode, subtotal) {
  const c = normalizeCode(rawCode);
  if (!c) throw new AppError("Vui lòng nhập mã voucher.", 400, "VALIDATION_ERROR");
  const sub = Number(subtotal);
  if (!Number.isFinite(sub) || sub < 0) {
    throw new AppError("Tạm tính không hợp lệ.", 400, "VALIDATION_ERROR");
  }
  const row = await getVoucherRowByCode(c);
  const discountAmount = assertRowApplicable(row, sub);

  const [result] = await pool.query(
    `
    UPDATE vouchers
    SET used_count = used_count + 1
    WHERE code = ?
      AND COALESCE(is_active::int, 0) = 1
      AND (usage_limit = 0 OR used_count < usage_limit)
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at >= NOW())
    `,
    [c]
  );
  if (result.affectedRows !== 1) {
    throw new AppError("Không thể áp dụng mã (hết lượt hoặc không hợp lệ).", 409, "VOUCHER_REDEEM_FAILED");
  }

  return {
    code: row.code,
    discountAmount,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderValue: Number(row.min_order_value || 0),
  };
}

module.exports = { normalizeCode, previewVoucher, redeemVoucher, getVoucherRowByCode };
