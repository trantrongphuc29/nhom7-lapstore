let cachedOrdersHasUserId = null;

async function ordersTableHasUserIdColumn(pool) {
  if (cachedOrdersHasUserId != null) return cachedOrdersHasUserId;
  try {
    const [rows] = await pool.query(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = ANY (current_schemas(false))
        AND table_name = 'orders'
        AND column_name = 'user_id'
      LIMIT 1
      `
    );
    cachedOrdersHasUserId = rows.length > 0;
  } catch {
    cachedOrdersHasUserId = false;
  }
  return cachedOrdersHasUserId;
}

module.exports = { ordersTableHasUserIdColumn };
