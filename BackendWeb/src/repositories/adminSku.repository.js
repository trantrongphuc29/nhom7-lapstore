async function findVariantBySku(conn, sku, variantId = null) {
  if (variantId != null) {
    const [[row]] = await conn.query(
      `SELECT id FROM product_variants WHERE sku = ? AND ( ? IS NULL OR id <> ? ) LIMIT 1`,
      [sku, variantId, variantId]
    );
    return row || null;
  }
  const [[row]] = await conn.query(`SELECT id FROM product_variants WHERE sku = ? LIMIT 1`, [sku]);
  return row || null;
}

async function findProductMetaBySku(conn, sku) {
  const [[row]] = await conn.query(`SELECT product_id FROM product_admin_meta WHERE sku = ? LIMIT 1`, [sku]);
  return row || null;
}

module.exports = { findVariantBySku, findProductMetaBySku };
