/**
 * Đồng bộ sequence SERIAL / IDENTITY với MAX(id) — tránh duplicate key trên pkey sau import SQL / lệch sequence (PostgreSQL).
 * Dùng tên bảng schema-qualified cho pg_get_serial_sequence vì search_path có thể khiến hàm trả về NULL.
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

  const qualifiedTable = `public.${tableName}`;
  const [seqRows] = await pool.query(`SELECT pg_get_serial_sequence(?, ?) AS seq`, [qualifiedTable, idColumn]);
  let seq = seqRows?.[0]?.seq;
  if (!seq) {
    const [fallback] = await pool.query(`SELECT pg_get_serial_sequence(?, ?) AS seq`, [tableName, idColumn]);
    seq = fallback?.[0]?.seq;
  }
  if (!seq) {
    throw new Error(
      `syncSerialSequenceToMax: không tìm thấy sequence cho ${qualifiedTable}.${idColumn} (kiểm tra IDENTITY/SERIAL).`
    );
  }

  const [mxRows] = await pool.query(`SELECT COALESCE(MAX("${idColumn}")::bigint, 0) AS mx FROM "${tableName}"`);
  const mxNum = Number(mxRows?.[0]?.mx ?? 0);

  if (mxNum <= 0) {
    await pool.query(`SELECT setval($1::regclass, 1, false)`, [seq]);
  } else {
    await pool.query(`SELECT setval($1::regclass, $2::bigint, true)`, [seq, mxNum]);
  }
}

module.exports = { syncSerialSequenceToMax };
