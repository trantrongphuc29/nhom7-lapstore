const pool = require('../config/database');

/** Khớp id gửi từ query `priceRanges` (lọc OR nhiều khoảng) */
const PRICE_BANDS = {
  under15: { min: null, max: 15_000_000 },
  '15-20': { min: 15_000_000, max: 20_000_000 },
  '20-25': { min: 20_000_000, max: 25_000_000 },
  '25-30': { min: 25_000_000, max: 30_000_000 },
  '30-35': { min: 30_000_000, max: 35_000_000 },
  over40: { min: 40_000_000, max: null },
};

function normalizeSearchKeyword(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ");
}

/** Tách từ khóa thành token (AND giữa các token). */
function tokenizeSearchKeyword(raw) {
  const n = normalizeSearchKeyword(raw);
  if (!n) return [];
  return n.split(/\s+/).filter((t) => t.length > 0);
}

/**
 * Mỗi token phải khớp ít nhất một trường (OR nội bộ); nhiều token = AND.
 * ILIKE: không phân biệt hoa thường (PostgreSQL).
 */
function buildKeywordFilterSql(values, keyword) {
  const tokens = tokenizeSearchKeyword(keyword);
  let sql = "";
  for (const token of tokens) {
    const pat = `%${token}%`;
    sql += ` AND (
      p.name ILIKE ? OR
      p.brand ILIKE ? OR
      COALESCE(p.description, '') ILIKE ? OR
      COALESCE(pam.sku, '') ILIKE ? OR
      COALESCE(pam.slug, '') ILIKE ? OR
      COALESCE(ps.cpu, '') ILIKE ? OR
      COALESCE(ps.gpu_onboard, '') ILIKE ? OR
      COALESCE(ps.gpu_discrete, '') ILIKE ? OR
      COALESCE(ps.ram, '') ILIKE ? OR
      COALESCE(ps.storage, '') ILIKE ? OR
      EXISTS (
        SELECT 1 FROM product_variants pv_kw
        WHERE pv_kw.product_id = p.id AND (
          COALESCE(pv_kw.sku, '') ILIKE ? OR
          COALESCE(pv_kw.ram, '') ILIKE ? OR
          COALESCE(pv_kw.storage, '') ILIKE ? OR
          COALESCE(pv_kw.version::text, '') ILIKE ? OR
          COALESCE(pv_kw.color::text, '') ILIKE ?
        )
      )
    )`;
    for (let i = 0; i < 15; i += 1) values.push(pat);
  }
  return sql;
}

/** Ưu tiên: khớp đúng tên (không wildcard) → tiền tố tên/brand → chứa tên/brand. */
function buildKeywordOrderSql(values, keyword) {
  const nk = normalizeSearchKeyword(keyword);
  if (!nk) return " ORDER BY p.created_at DESC";
  const exact = nk;
  const pref = `${nk}%`;
  const cont = `%${nk}%`;
  values.push(exact, pref, pref, cont, cont);
  return ` ORDER BY (
    CASE
      WHEN p.name ILIKE ? THEN 0
      WHEN p.name ILIKE ? THEN 1
      WHEN p.brand ILIKE ? THEN 2
      WHEN p.name ILIKE ? THEN 3
      WHEN p.brand ILIKE ? THEN 4
      ELSE 5
    END
  ) ASC, p.created_at DESC`;
}

class Product {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.brand = data.brand;
    this.image = data.image;
    this.description = data.description;
    this.created_at = data.created_at;
  }

  // Lấy tất cả sản phẩm kèm giá thấp nhất từ variants
  static async read() {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.brand, p.description, p.created_at,
             MIN(pv.price) AS min_price, MAX(pv.discount) AS min_discount,
             MAX(ps.cpu) AS cpu, MAX(ps.screen_resolution) AS screen_resolution, MAX(ps.screen_technology) AS screen_technology,
             MIN(pv.ram) AS ram, MIN(pv.storage) AS storage,
             COUNT(DISTINCT pv.id) AS variant_count,
             (SELECT STRING_AGG(x.c, '|' ORDER BY x.c)
              FROM (
                SELECT DISTINCT TRIM(pv2.color::text) AS c
                FROM product_variants pv2
                WHERE pv2.product_id = p.id
                  AND TRIM(COALESCE(pv2.color::text, '')) <> ''
              ) x) AS colors,
             MAX(pam.sku) AS master_sku,
             MIN(NULLIF(TRIM(pv.sku), '')) AS first_variant_sku,
             COALESCE(MAX(pam.sku), MIN(NULLIF(TRIM(pv.sku), ''))) AS display_sku,
             COALESCE(
               (SELECT pi.image_url FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_main DESC, pi.sort_order ASC, pi.id ASC LIMIT 1),
               (SELECT pv2.image FROM product_variants pv2
                WHERE pv2.product_id = p.id AND pv2.image IS NOT NULL AND TRIM(pv2.image) <> ''
                ORDER BY pv2.id ASC LIMIT 1)
             ) AS image,
             (SELECT pi2.image_url FROM product_images pi2
              WHERE pi2.product_id = p.id
              ORDER BY pi2.is_main DESC, pi2.sort_order ASC, pi2.id ASC
              LIMIT 1 OFFSET 1) AS image2
      FROM products p
      LEFT JOIN product_admin_meta pam ON pam.product_id = p.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN product_specs ps ON ps.product_id = p.id
      GROUP BY p.id, p.name, p.brand, p.description, p.created_at
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  // Tìm kiếm với filter (dùng JOIN sang specs và variants)
  static async search(filters = {}) {
    const { brands, cpu, ram, storage, minPrice, maxPrice, priceRanges } = filters;
    const keyword =
      filters.keyword != null && String(filters.keyword).trim() !== ""
        ? normalizeSearchKeyword(filters.keyword)
        : null;
    let query = `
      SELECT p.id, p.name, p.brand, p.description, p.created_at,
             MIN(pv.price) AS min_price, MAX(pv.discount) AS min_discount,
             MAX(ps.cpu) AS cpu, MAX(ps.screen_resolution) AS screen_resolution, MAX(ps.screen_technology) AS screen_technology,
             MIN(pv.ram) AS ram, MIN(pv.storage) AS storage,
             COUNT(DISTINCT pv.id) AS variant_count,
             (SELECT STRING_AGG(x.c, '|' ORDER BY x.c)
              FROM (
                SELECT DISTINCT TRIM(pv2.color::text) AS c
                FROM product_variants pv2
                WHERE pv2.product_id = p.id
                  AND TRIM(COALESCE(pv2.color::text, '')) <> ''
              ) x) AS colors,
             MAX(pam.sku) AS master_sku,
             MIN(NULLIF(TRIM(pv.sku), '')) AS first_variant_sku,
             COALESCE(MAX(pam.sku), MIN(NULLIF(TRIM(pv.sku), ''))) AS display_sku,
             MAX(pam.slug) AS slug,
             MAX(pam.status) AS status,
             COALESCE(
               (SELECT pi.image_url FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_main DESC, pi.sort_order ASC, pi.id ASC LIMIT 1),
               (SELECT pv2.image FROM product_variants pv2
                WHERE pv2.product_id = p.id AND pv2.image IS NOT NULL AND TRIM(pv2.image) <> ''
                ORDER BY pv2.id ASC LIMIT 1)
             ) AS image,
             (SELECT pi2.image_url FROM product_images pi2
              WHERE pi2.product_id = p.id
              ORDER BY pi2.is_main DESC, pi2.sort_order ASC, pi2.id ASC
              LIMIT 1 OFFSET 1) AS image2
      FROM products p
      LEFT JOIN product_admin_meta pam ON pam.product_id = p.id
      LEFT JOIN product_specs ps ON ps.product_id = p.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE 1=1
    `;
    const values = [];

    if (keyword) {
      query += buildKeywordFilterSql(values, keyword);
    }
    if (brands && brands.length > 0) {
      query += ` AND p.brand IN (${brands.map(() => '?').join(',')})`;
      values.push(...brands);
    }
    if (cpu) {
      query += " AND ps.cpu ILIKE ?";
      values.push(`%${cpu}%`);
    }
    if (ram) {
      query += " AND pv.ram ILIKE ?";
      values.push(`%${ram}%`);
    }
    if (storage) {
      query += " AND pv.storage ILIKE ?";
      values.push(`%${storage}%`);
    }
    if (priceRanges && priceRanges.length > 0) {
      const bandSql = [];
      for (const id of priceRanges) {
        const b = PRICE_BANDS[id];
        if (!b) continue;
        if (b.min == null && b.max != null) {
          bandSql.push('pv.price <= ?');
          values.push(b.max);
        } else if (b.min != null && b.max == null) {
          bandSql.push('pv.price >= ?');
          values.push(b.min);
        } else if (b.min != null && b.max != null) {
          bandSql.push('(pv.price >= ? AND pv.price <= ?)');
          values.push(b.min, b.max);
        }
      }
      if (bandSql.length) {
        query += ` AND (${bandSql.join(' OR ')})`;
      }
    } else {
      if (minPrice) {
        query += ' AND pv.price >= ?';
        values.push(minPrice);
      }
      if (maxPrice) {
        query += ' AND pv.price <= ?';
        values.push(maxPrice);
      }
    }

    query += " GROUP BY p.id, p.name, p.brand, p.description, p.created_at";
    query += keyword ? buildKeywordOrderSql(values, keyword) : " ORDER BY p.created_at DESC";
    const [rows] = await pool.query(query, values);
    return rows;
  }

  // Lấy chi tiết sản phẩm kèm specs và tất cả variants
  static async findById(id) {
    // 1. product + specs
    const [productRows] = await pool.query(`
    SELECT p.*, ps.*
    FROM products p
    LEFT JOIN product_specs ps ON p.id = ps.product_id
    WHERE p.id = ?
  `, [id]);

    if (productRows.length === 0) return null;

    const product = productRows[0];

    // 2. variants
    const [variants] = await pool.query(`
    SELECT *
    FROM product_variants
    WHERE product_id = ?
  `, [id]);

    // 3. images
    const [images] = await pool.query(`
    SELECT id, image_url, is_main, sort_order
    FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC
  `, [id]);

    // 4. mô tả từ admin (product_admin_meta) — khớp form admin: mô tả ngắn + chi tiết HTML
    const [[pam]] = await pool.query(
      `SELECT short_description, detail_html, sku AS master_sku, slug, status FROM product_admin_meta WHERE product_id = ? LIMIT 1`,
      [id]
    );

    const shortDescription =
      pam?.short_description != null && String(pam.short_description).trim() !== ""
        ? pam.short_description
        : product.description || null;
    const detailHtml =
      pam?.detail_html != null && String(pam.detail_html).trim() !== "" ? pam.detail_html : null;

    return {
      ...product,
      shortDescription,
      detailHtml,
      masterSku: pam?.master_sku || null,
      slug: pam?.slug || null,
      status: pam?.status ?? null,
      specs: product,
      variants,
      images,
    };
  }

  /** Chi tiết theo slug (mọi trạng thái hiển thị trên storefront) */
  static async findBySlug(slug) {
    const trimmed = String(slug || "").trim();
    if (!trimmed) return null;
    const [[row]] = await pool.query(
      `SELECT product_id FROM product_admin_meta WHERE slug = ? LIMIT 1`,
      [trimmed]
    );
    if (!row) return null;
    return Product.findById(row.product_id);
  }

  async save() {
    const [result] = await pool.query(
      'INSERT INTO products (name, brand, image, description) VALUES (?, ?, ?, ?)',
      [this.name, this.brand, this.image, this.description]
    );
    this.id = result.insertId;
    return this;
  }

  async update() {
    await pool.query(
      'UPDATE products SET name=?, brand=?, image=?, description=? WHERE id=?',
      [this.name, this.brand, this.image, this.description, this.id]
    );
    return this;
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Product;
