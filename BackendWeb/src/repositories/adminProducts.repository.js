const pool = require("../../config/database");

function buildListWhere(filters, values) {
  let where = " WHERE 1=1 ";
  if (filters.search) {
    where +=
      " AND (p.name LIKE ? OR pam.sku LIKE ? OR pam.slug LIKE ? OR EXISTS (SELECT 1 FROM product_variants pv2 WHERE pv2.product_id = p.id AND pv2.sku LIKE ?)) ";
    const keyword = `%${filters.search}%`;
    values.push(keyword, keyword, keyword, keyword);
  }
  if (filters.brand) {
    where += " AND p.brand = ? ";
    values.push(filters.brand);
  }
  if (filters.status) {
    where += " AND pam.status = ? ";
    values.push(filters.status);
  }
  if (filters.minPrice != null) {
    where +=
      " AND EXISTS (SELECT 1 FROM product_variants pv_price_min WHERE pv_price_min.product_id = p.id AND COALESCE(pv_price_min.retail_price, pv_price_min.price, pv_price_min.original_price, 0) >= ?) ";
    values.push(filters.minPrice);
  }
  if (filters.maxPrice != null) {
    where +=
      " AND EXISTS (SELECT 1 FROM product_variants pv_price_max WHERE pv_price_max.product_id = p.id AND COALESCE(pv_price_max.retail_price, pv_price_max.price, pv_price_max.original_price, 0) <= ?) ";
    values.push(filters.maxPrice);
  }
  return where;
}

async function queryAdminProductsList({ filters, sortBy, sortDir, limit, offset }) {
  const values = [];
  const whereSql = buildListWhere(filters, values);

  const [countRows] = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN product_admin_meta pam ON pam.product_id = p.id
      ${whereSql}
    `,
    values
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.query(
    `
      SELECT
        p.id,
        p.name,
        p.brand,
        p.created_at,
        pam.sku,
        pam.slug,
        pam.status,
        pam.sale_price,
        MIN(COALESCE(pv.retail_price, pv.price, pv.original_price)) AS min_retail_price,
        MIN(
          CASE
            WHEN COALESCE(pv.price, pv.retail_price, pv.original_price) IS NULL THEN NULL
            ELSE ROUND(
              COALESCE(pv.price, pv.retail_price, pv.original_price) * (100 - COALESCE(pv.discount, 0)) / 100,
              0
            )
          END
        ) AS min_variant_price,
        COALESCE(SUM(pv.stock), 0) AS stock,
        STRING_AGG(DISTINCT NULLIF(TRIM(pv.sku), ''), ', ' ORDER BY pv.sku) AS variant_skus
      FROM products p
      LEFT JOIN product_admin_meta pam ON pam.product_id = p.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      ${whereSql}
      GROUP BY p.id, p.name, p.brand, p.created_at, pam.sku, pam.slug, pam.status, pam.sale_price
      ORDER BY ${sortBy === "stock" ? "stock" : sortBy === "sale_price" ? "min_retail_price" : sortBy === "name" ? "p.name" : "p.created_at"} ${sortDir}
      LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  return { total, rows };
}

module.exports = { queryAdminProductsList };
