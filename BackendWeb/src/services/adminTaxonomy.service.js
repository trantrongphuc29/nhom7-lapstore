const pool = require("../../config/database");
const AppError = require("../utils/AppError");
const { createAuditLog } = require("./adminAudit.service");
const { slugify } = require("../utils/slug");
const { syncSerialSequenceToMax } = require("../utils/pgSequence");

async function getBrands() {
  const [rows] = await pool.query(
    `
      SELECT
        b.id,
        b.name,
        b.slug,
        b.sort_order AS sortOrder,
        b.is_active AS isActive,
        b.created_at AS createdAt,
        (
          SELECT COUNT(*)
          FROM product_admin_meta pam
          WHERE pam.brand_id = b.id
        ) AS productCount
      FROM brands b
      ORDER BY b.sort_order ASC, b.id DESC
    `
  );
  return { records: rows };
}

async function getCategories() {
  const [rows] = await pool.query(
    `
      SELECT id, parent_id AS parentId, name, slug, sort_order AS sortOrder, is_active AS isActive
      FROM categories
      ORDER BY id DESC
    `
  );
  return { records: rows };
}

async function createBrand(payload, actorId = null) {
  const name = payload.name?.trim();
  const slug = payload.slug?.trim() || slugify(name);
  if (!name || !slug) throw new AppError("name and slug are required", 400, "VALIDATION_ERROR");
  const [[dup]] = await pool.query(`SELECT id FROM brands WHERE name = ? OR slug = ? LIMIT 1`, [name, slug]);
  if (dup) throw new AppError("Tên hoặc slug thương hiệu đã tồn tại", 409, "DUPLICATE_BRAND");
  await syncSerialSequenceToMax(pool, "brands", "id");
  const [result] = await pool.query(
    `
      INSERT INTO brands (name, slug, logo_url, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?)
    `,
    [name, slug, null, Number(payload.sortOrder || 0), payload.isActive === false ? 0 : 1]
  );
  await createAuditLog({
    userId: actorId,
    module: "brands",
    action: "create",
    targetType: "brand",
    targetId: result.insertId,
    metadata: { name, slug },
  });
  return { id: result.insertId, message: "Brand created successfully" };
}

async function updateBrand(id, payload, actorId = null) {
  const brandId = Number(id);
  if (!Number.isInteger(brandId) || brandId <= 0) throw new AppError("Invalid brand id", 400, "VALIDATION_ERROR");
  const name = payload.name?.trim();
  const slug = payload.slug?.trim() || slugify(name);
  if (!name || !slug) throw new AppError("name and slug are required", 400, "VALIDATION_ERROR");
  const [[exists]] = await pool.query(`SELECT id FROM brands WHERE id = ? LIMIT 1`, [brandId]);
  if (!exists) throw new AppError("Brand not found", 404, "NOT_FOUND");
  const [[dup]] = await pool.query(`SELECT id FROM brands WHERE (name = ? OR slug = ?) AND id <> ? LIMIT 1`, [name, slug, brandId]);
  if (dup) throw new AppError("Tên hoặc slug thương hiệu đã tồn tại", 409, "DUPLICATE_BRAND");
  await pool.query(
    `
      UPDATE brands
      SET name = ?, slug = ?, logo_url = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `,
    [
      name,
      slug,
      null,
      Number(payload.sortOrder || 0),
      payload.isActive === false ? 0 : 1,
      brandId,
    ]
  );
  await createAuditLog({
    userId: actorId,
    module: "brands",
    action: "update",
    targetType: "brand",
    targetId: brandId,
    metadata: { name: payload.name, slug: payload.slug },
  });
  return { id: brandId, message: "Brand updated successfully" };
}

async function deleteBrand(id, actorId = null) {
  const brandId = Number(id);
  if (!Number.isInteger(brandId) || brandId <= 0) throw new AppError("Invalid brand id", 400, "VALIDATION_ERROR");
  const [[row]] = await pool.query(`SELECT id, name, slug FROM brands WHERE id = ? LIMIT 1`, [brandId]);
  if (!row) throw new AppError("Brand not found", 404, "NOT_FOUND");
  const [[inUse]] = await pool.query(`SELECT COUNT(*) AS total FROM product_admin_meta WHERE brand_id = ?`, [brandId]);
  if (Number(inUse?.total || 0) > 0) {
    throw new AppError("Không thể xóa thương hiệu đang được gán cho sản phẩm", 409, "BRAND_IN_USE");
  }
  await pool.query(`DELETE FROM brands WHERE id = ?`, [brandId]);
  await createAuditLog({
    userId: actorId,
    module: "brands",
    action: "delete",
    targetType: "brand",
    targetId: brandId,
    metadata: { name: row.name, slug: row.slug },
  });
  return { id: brandId, message: "Brand deleted successfully" };
}

async function createCategory(payload, actorId = null) {
  const name = payload.name?.trim();
  const slug = payload.slug?.trim();
  if (!name || !slug) throw new AppError("name and slug are required", 400, "VALIDATION_ERROR");
  const [result] = await pool.query(
    `
      INSERT INTO categories (parent_id, name, slug, sort_order, is_active, meta_title, meta_description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.parentId || null,
      name,
      slug,
      Number(payload.sortOrder || 0),
      payload.isActive === false ? 0 : 1,
      payload.metaTitle || null,
      payload.metaDescription || null,
    ]
  );
  await createAuditLog({
    userId: actorId,
    module: "categories",
    action: "create",
    targetType: "category",
    targetId: result.insertId,
    metadata: { name, slug, parentId: payload.parentId || null },
  });
  return { id: result.insertId, message: "Category created successfully" };
}

async function updateCategory(id, payload, actorId = null) {
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) throw new AppError("Invalid category id", 400, "VALIDATION_ERROR");
  await pool.query(
    `
      UPDATE categories
      SET parent_id = ?, name = ?, slug = ?, sort_order = ?, is_active = ?, meta_title = ?, meta_description = ?
      WHERE id = ?
    `,
    [
      payload.parentId || null,
      payload.name?.trim() || "",
      payload.slug?.trim() || "",
      Number(payload.sortOrder || 0),
      payload.isActive === false ? 0 : 1,
      payload.metaTitle || null,
      payload.metaDescription || null,
      categoryId,
    ]
  );
  await createAuditLog({
    userId: actorId,
    module: "categories",
    action: "update",
    targetType: "category",
    targetId: categoryId,
    metadata: { name: payload.name, slug: payload.slug, parentId: payload.parentId || null },
  });
  return { id: categoryId, message: "Category updated successfully" };
}

module.exports = {
  getBrands,
  getCategories,
  createBrand,
  updateBrand,
  deleteBrand,
  createCategory,
  updateCategory,
};
