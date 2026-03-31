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
      SELECT p.*, MIN(pv.price) AS min_price, MAX(pv.discount) AS min_discount,
             ps.cpu, ps.screen_resolution, ps.screen_technology,
             MIN(pv.ram) AS ram, MIN(pv.storage) AS storage,
             COUNT(DISTINCT pv.id) AS variant_count,
             GROUP_CONCAT(DISTINCT pv.color ORDER BY pv.color SEPARATOR '|') AS colors,
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
             ) AS image
      FROM products p
      LEFT JOIN product_admin_meta pam ON pam.product_id = p.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN product_specs ps ON ps.product_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    return rows;
  }

  // Tìm kiếm với filter (dùng JOIN sang specs và variants)
  static async search(filters = {}) {
    const { keyword, brands, cpu, ram, storage, minPrice, maxPrice, priceRanges } = filters;
    let query = `
      SELECT p.*, MIN(pv.price) AS min_price, MAX(pv.discount) AS min_discount,
             ps.cpu, ps.screen_resolution, ps.screen_technology,
             MIN(pv.ram) AS ram, MIN(pv.storage) AS storage,
             COUNT(DISTINCT pv.id) AS variant_count,
             GROUP_CONCAT(DISTINCT pv.color ORDER BY pv.color SEPARATOR '|') AS colors,
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
             ) AS image
      FROM products p
      LEFT JOIN product_admin_meta pam ON pam.product_id = p.id
      LEFT JOIN product_specs ps ON ps.product_id = p.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE 1=1
    `;
    const values = [];

    if (keyword) {
      const kw = `%${keyword}%`;
      query +=
        ' AND (p.name LIKE ? OR pam.sku LIKE ? OR EXISTS (SELECT 1 FROM product_variants pv3 WHERE pv3.product_id = p.id AND pv3.sku LIKE ?))';
      values.push(kw, kw, kw);
    }
    if (brands && brands.length > 0) {
      query += ` AND p.brand IN (${brands.map(() => '?').join(',')})`;
      values.push(...brands);
    }
    if (cpu) {
      query += ' AND ps.cpu LIKE ?';
      values.push(`%${cpu}%`);
    }
    if (ram) {
      query += ' AND pv.ram LIKE ?';
      values.push(`%${ram}%`);
    }
    if (storage) {
      query += ' AND pv.storage LIKE ?';
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

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';
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
