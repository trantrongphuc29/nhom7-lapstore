/**
 * Đồng bộ sequence SERIAL với MAX(id) — tránh duplicate key trên pkey sau import SQL / lệch sequence (PostgreSQL).
 */
async function syncSerialSequenceToMax(pool, tableName, idColumn = "id") {
  const allowed = new Set([
    "brands",
    "categories",
    "products",
    "product_specs",
    "product_variants",
    "product_images",
  ]);
  if (!allowed.has(tableName)) {
    throw new Error(`syncSerialSequenceToMax: bảng không được phép: ${tableName}`);
  }
  const [[{ mx }]] = await pool.query(`SELECT COALESCE(MAX("${idColumn}"), 0) AS mx FROM "${tableName}"`);
  const mxNum = Number(mx);
  if (mxNum === 0) {
    await pool.query(`SELECT setval(pg_get_serial_sequence($1, $2), 1, false)`, [tableName, idColumn]);
  } else {
    await pool.query(`SELECT setval(pg_get_serial_sequence($1, $2), $3::bigint, true)`, [
      tableName,
      idColumn,
      mxNum,
    ]);
  }
}

module.exports = { syncSerialSequenceToMax };
