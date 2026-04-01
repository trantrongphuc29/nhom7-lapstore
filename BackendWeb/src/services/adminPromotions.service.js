const pool = require("../../config/database");
const AppError = require("../utils/AppError");
const { createAuditLog } = require("./adminAudit.service");
const { normalizeCode: normalizeVoucherCode } = require("./vouchers.service");

function isPgSchemaError(error) {
  const code = String(error?.code || "");
  return code === "42P01" || code === "42703";
}

async function safeQuery(query, params = [], fallback = []) {
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    if (isPgSchemaError(error)) return fallback;
    throw error;
  }
}

function normalizeVoucherPayload(payload) {
  const code = normalizeVoucherCode(payload.code);
  if (!code || !payload.discountType || payload.discountValue == null) {
    throw new AppError("code, discountType, discountValue are required", 400, "VALIDATION_ERROR");
  }
  if (!["percent", "fixed"].includes(payload.discountType)) {
    throw new AppError("discountType must be percent or fixed", 400, "VALIDATION_ERROR");
  }
  const discountValue = Number(payload.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new AppError("discountValue must be a positive number", 400, "VALIDATION_ERROR");
  }
  if (payload.discountType === "percent" && discountValue > 100) {
    throw new AppError("discountValue percent cannot exceed 100", 400, "VALIDATION_ERROR");
  }
  const minOrderValue = Number(payload.minOrderValue || 0);
  const usageLimit = Number(payload.usageLimit || 0);
  if (!Number.isFinite(minOrderValue) || minOrderValue < 0 || !Number.isFinite(usageLimit) || usageLimit < 0) {
    throw new AppError("minOrderValue and usageLimit must be non-negative numbers", 400, "VALIDATION_ERROR");
  }
  return {
    code,
    discountType: payload.discountType,
    discountValue,
    minOrderValue,
    usageLimit,
    startsAt: payload.startsAt || null,
    endsAt: payload.endsAt || null,
    isActive: payload.isActive === false ? 0 : 1,
  };
}

async function getPromotionsOverview() {
  const vouchers = await safeQuery(
    `
      SELECT id, code, discount_type AS discountType, discount_value AS discountValue, min_order_value AS minOrderValue, usage_limit AS usageLimit, used_count AS usedCount, starts_at AS startsAt, ends_at AS endsAt, is_active AS isActive
      FROM vouchers
      ORDER BY id DESC
      LIMIT 100
    `,
    [],
    []
  );
  return { vouchers };
}

async function createVoucher(payload, actorId = null) {
  const v = normalizeVoucherPayload(payload);

  const [result] = await pool.query(
    `
      INSERT INTO vouchers (code, discount_type, discount_value, min_order_value, usage_limit, starts_at, ends_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      v.code,
      v.discountType,
      v.discountValue,
      v.minOrderValue,
      v.usageLimit,
      v.startsAt,
      v.endsAt,
      v.isActive,
    ]
  );
  await createAuditLog({
    userId: actorId,
    module: "promotions",
    action: "voucher_create",
    targetType: "voucher",
    targetId: result.insertId,
    metadata: { code: v.code, discountType: v.discountType },
  });
  return { id: result.insertId, message: "Voucher created successfully" };
}

async function updateVoucher(id, payload, actorId = null) {
  const vid = Number(id);
  if (!Number.isInteger(vid) || vid <= 0) throw new AppError("Invalid voucher id", 400, "VALIDATION_ERROR");
  const [[existing]] = await pool.query(`SELECT id, code FROM vouchers WHERE id = ? LIMIT 1`, [vid]);
  if (!existing) throw new AppError("Voucher not found", 404, "NOT_FOUND");

  const v = normalizeVoucherPayload(payload);

  const [[dup]] = await pool.query(`SELECT id FROM vouchers WHERE code = ? AND id <> ? LIMIT 1`, [v.code, vid]);
  if (dup) throw new AppError("Mã voucher đã tồn tại", 409, "DUPLICATE_CODE");

  await pool.query(
    `
      UPDATE vouchers
      SET code = ?, discount_type = ?, discount_value = ?, min_order_value = ?, usage_limit = ?,
          starts_at = ?, ends_at = ?, is_active = ?
      WHERE id = ?
    `,
    [
      v.code,
      v.discountType,
      v.discountValue,
      v.minOrderValue,
      v.usageLimit,
      v.startsAt,
      v.endsAt,
      v.isActive,
      vid,
    ]
  );

  await createAuditLog({
    userId: actorId,
    module: "promotions",
    action: "voucher_update",
    targetType: "voucher",
    targetId: vid,
    metadata: { code: v.code, discountType: v.discountType },
  });
  return { id: vid, message: "Voucher updated successfully" };
}

async function deleteVoucher(id, actorId = null) {
  const vid = Number(id);
  if (!Number.isInteger(vid) || vid <= 0) throw new AppError("Invalid voucher id", 400, "VALIDATION_ERROR");
  const [[row]] = await pool.query(`SELECT code FROM vouchers WHERE id = ? LIMIT 1`, [vid]);
  if (!row) throw new AppError("Voucher not found", 404, "NOT_FOUND");

  const [result] = await pool.query(`DELETE FROM vouchers WHERE id = ?`, [vid]);
  if (result.affectedRows !== 1) throw new AppError("Voucher not found", 404, "NOT_FOUND");

  await createAuditLog({
    userId: actorId,
    module: "promotions",
    action: "voucher_delete",
    targetType: "voucher",
    targetId: vid,
    metadata: { code: row.code },
  });
  return { message: "Voucher deleted successfully" };
}

module.exports = { getPromotionsOverview, createVoucher, updateVoucher, deleteVoucher };
