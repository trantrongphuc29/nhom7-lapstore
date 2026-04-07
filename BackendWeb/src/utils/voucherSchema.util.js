let cachedVouchersHasMaxDiscountAmount = null;

async function vouchersTableHasMaxDiscountAmount(pool) {
  if (cachedVouchersHasMaxDiscountAmount != null) return cachedVouchersHasMaxDiscountAmount;
  try {
    const [rows] = await pool.query(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = ANY (current_schemas(false))
        AND table_name = 'vouchers'
        AND column_name = 'max_discount_amount'
      LIMIT 1
      `
    );
    cachedVouchersHasMaxDiscountAmount = rows.length > 0;
  } catch {
    cachedVouchersHasMaxDiscountAmount = false;
  }
  return cachedVouchersHasMaxDiscountAmount;
}

async function ensureVouchersMaxDiscountAmountColumn(pool) {
  const hasColumn = await vouchersTableHasMaxDiscountAmount(pool);
  if (hasColumn) return true;
  await pool.query(`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC(12,2) NULL`);
  cachedVouchersHasMaxDiscountAmount = true;
  return true;
}

module.exports = {
  vouchersTableHasMaxDiscountAmount,
  ensureVouchersMaxDiscountAmountColumn,
};
