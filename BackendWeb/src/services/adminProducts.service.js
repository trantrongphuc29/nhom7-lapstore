const pool = require("../../config/database");
const AppError = require("../utils/AppError");
const { computeVariantPricing, marginBadgeClass } = require("../utils/pricingEngine");
const { canEditCostAndImport } = require("../config/rbac");
const adminSettingsService = require("./adminSettings.service");
const { createAuditLog } = require("./adminAudit.service");
const { queryAdminProductsList } = require("../repositories/adminProducts.repository");
const { findVariantBySku, findProductMetaBySku } = require("../repositories/adminSku.repository");
const {
  normalizeSku,
  validateSkuFormat,
  suggestVariantSku,
  suggestProductSku,
} = require("../utils/sku");
const { slugify } = require("../utils/slug");

async function getAdminProducts(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(query.limit) || 10));
  const offset = (page - 1) * limit;
  const sortBy = ["created_at", "name", "sale_price", "stock"].includes(query.sortBy) ? query.sortBy : "created_at";
  const sortDir = query.sortDir === "asc" ? "ASC" : "DESC";
  const filters = {
    search: query.search?.trim() || "",
    brand: query.brand?.trim() || "",
    status: query.status?.trim() || "",
    minPrice: query.minPrice != null && query.minPrice !== "" ? Number(query.minPrice) : null,
    maxPrice: query.maxPrice != null && query.maxPrice !== "" ? Number(query.maxPrice) : null,
  };

  const { total, rows } = await queryAdminProductsList({ filters, sortBy, sortDir, limit, offset });

  return {
    records: rows.map((row) => {
      // Admin list price source: variant retail price (final selling price).
      const salePrice = Number(row.min_retail_price || 0);
      return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        sku: row.sku,
        variantSkus: row.variant_skus || "",
        slug: row.slug,
        status: row.status || "active",
        salePrice,
        stock: Number(row.stock || 0),
        createdAt: row.created_at,
      };
    }),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function assertSkuFreeForVariant(conn, rawSku, productId, variantId) {
  const sku = normalizeSku(rawSku);
  const fmt = validateSkuFormat(sku);
  if (fmt) throw new AppError(fmt, 400, "VALIDATION_ERROR");
  const vid = Number.isInteger(variantId) && variantId > 0 ? variantId : null;
  const [[rowV]] = await conn.query(
    `SELECT id FROM product_variants WHERE sku = ? AND ( ? IS NULL OR id <> ? ) LIMIT 1`,
    [sku, vid, vid]
  );
  if (rowV) throw new AppError("SKU phiên bản đã tồn tại (trùng với phiên bản khác)", 409, "SKU_CONFLICT");
  const [[rowP]] = await conn.query(`SELECT product_id FROM product_admin_meta WHERE sku = ? LIMIT 1`, [sku]);
  if (rowP) {
    throw new AppError(
      "SKU trùng với mã sản phẩm (SKU ở phần thông tin chung) — dùng mã khác cho phiên bản",
      409,
      "SKU_CONFLICT"
    );
  }
}

async function assertSkuFreeForProductMeta(conn, rawSku, productId) {
  const sku = normalizeSku(rawSku);
  const fmt = validateSkuFormat(sku);
  if (fmt) throw new AppError(fmt, 400, "VALIDATION_ERROR");
  const [[rowP]] = await conn.query(
    `SELECT product_id FROM product_admin_meta WHERE sku = ? AND product_id <> ? LIMIT 1`,
    [sku, productId]
  );
  if (rowP) throw new AppError("SKU sản phẩm (thông tin chung) đã tồn tại", 409, "SKU_CONFLICT");
  const [[rowV]] = await conn.query(`SELECT id FROM product_variants WHERE sku = ? LIMIT 1`, [sku]);
  if (rowV) throw new AppError("SKU trùng với mã phiên bản đã có", 409, "SKU_CONFLICT");
}

function assertDistinctVariantSkusInPayload(variants) {
  const seen = new Set();
  for (const v of variants || []) {
    const s = normalizeSku(v?.sku);
    if (!s) continue;
    if (seen.has(s)) throw new AppError(`Trùng SKU trong cùng form: ${s}`, 400, "SKU_DUPLICATE");
    seen.add(s);
  }
}

function mapMysqlDuplicateToAppError(error) {
  if (error?.code !== "ER_DUP_ENTRY") return null;
  const msg = String(error.sqlMessage || "");
  if (msg.includes("uk_product_variants_sku") || msg.includes("product_variants.sku")) {
    return new AppError("SKU phiên bản trùng với bản ghi khác — đổi mã phiên bản", 409, "SKU_CONFLICT");
  }
  return new AppError("SKU thông tin chung hoặc slug đã tồn tại", 409, "CONFLICT");
}

function normalizeCategoryId(raw) {
  if (raw === "" || raw == null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function resolveBrandId(conn, brandName) {
  if (!brandName?.trim()) return null;
  const brand = brandName.trim();
  const [[exact]] = await conn.query("SELECT id FROM brands WHERE name = ? LIMIT 1", [brand]);
  if (exact?.id) return exact.id;

  const [[ci]] = await conn.query("SELECT id FROM brands WHERE LOWER(name) = LOWER(?) LIMIT 1", [brand]);
  if (ci?.id) return ci.id;

  const slug = slugify(brand);
  const [[bySlug]] = await conn.query("SELECT id FROM brands WHERE slug = ? LIMIT 1", [slug]);
  if (bySlug?.id) return bySlug.id;

  const [ins] = await conn.query(
    `
      INSERT INTO brands (name, slug, logo_url, sort_order, is_active)
      VALUES (?, ?, NULL, 0, 1)
    `,
    [brand, slug]
  );
  return ins.insertId;
}

async function saveProductImages(conn, productId, images) {
  const imgs = Array.isArray(images) ? images.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean) : [];
  if (imgs.length === 0) return;
  await conn.query("DELETE FROM product_images WHERE product_id = ?", [productId]);
  for (let i = 0; i < imgs.length; i += 1) {
    await conn.query(
      `INSERT INTO product_images (product_id, image_url, is_main, sort_order) VALUES (?, ?, ?, ?)`,
      [productId, imgs[i], i === 0 ? 1 : 0, i]
    );
  }
}

/** Chuẩn hoá payload specs từ admin (camelCase hoặc snake_case). */
function normalizeSpecsPayload(raw) {
  if (raw === undefined || raw === null || typeof raw !== "object") return null;
  const str = (v) => {
    if (v === undefined || v === null) return null;
    const t = String(v).trim();
    return t === "" ? null : t;
  };
  return {
    cpu: str(raw.cpu),
    gpu_onboard: str(raw.gpuOnboard ?? raw.gpu_onboard),
    gpu_discrete: str(raw.gpuDiscrete ?? raw.gpu_discrete),
    ram: str(raw.ram),
    ram_max: str(raw.ramMax ?? raw.ram_max),
    storage: str(raw.storage),
    storage_max: str(raw.storageMax ?? raw.storage_max),
    screen_size: str(raw.screenSize ?? raw.screen_size),
    screen_resolution: str(raw.screenResolution ?? raw.screen_resolution),
    screen_technology: str(raw.screenTechnology ?? raw.screen_technology),
    ports: str(raw.ports),
    battery: str(raw.battery),
    dimensions: str(raw.dimensions),
    weight: str(raw.weight),
    material: str(raw.material),
    wireless: str(raw.wireless),
    webcam: str(raw.webcam),
    os: str(raw.os),
  };
}

async function upsertProductSpecs(conn, productId, rawSpecs) {
  const s = normalizeSpecsPayload(rawSpecs ?? {});
  if (!s) return;
  const vals = [
    s.cpu,
    s.gpu_onboard,
    s.gpu_discrete,
    s.ram,
    s.ram_max,
    s.storage,
    s.storage_max,
    s.screen_size,
    s.screen_resolution,
    s.screen_technology,
    s.ports,
    s.battery,
    s.dimensions,
    s.weight,
    s.material,
    s.wireless,
    s.webcam,
    s.os,
  ];
  const [[existing]] = await conn.query("SELECT product_id FROM product_specs WHERE product_id = ? LIMIT 1", [productId]);
  if (existing) {
    await conn.query(
      `
      UPDATE product_specs SET
        cpu=?, gpu_onboard=?, gpu_discrete=?, ram=?, ram_max=?, storage=?, storage_max=?,
        screen_size=?, screen_resolution=?, screen_technology=?, ports=?, battery=?, dimensions=?, weight=?,
        material=?, wireless=?, webcam=?, os=?
      WHERE product_id=?
      `,
      [...vals, productId]
    );
  } else {
    await conn.query(
      `
      INSERT INTO product_specs (
        product_id, cpu, gpu_onboard, gpu_discrete, ram, ram_max, storage, storage_max,
        screen_size, screen_resolution, screen_technology, ports, battery, dimensions, weight, material, wireless, webcam, os
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [productId, ...vals]
    );
  }
}

async function upsertProductAdminMeta(conn, productId, payload, sku, slug, categoryId, brandId) {
  const [[existing]] = await conn.query("SELECT product_id FROM product_admin_meta WHERE product_id = ? LIMIT 1", [productId]);
  const commonArgs = [
    sku,
    slug,
    payload.shortDescription || null,
    payload.detailHtml || null,
    categoryId,
    brandId,
    Number(payload.listPrice || 0),
    Number(payload.salePrice || 0),
    Number(payload.costPrice || 0),
    payload.status || "active",
    payload.metaTitle || null,
    payload.metaDescription || null,
    payload.canonicalUrl || null,
  ];
  if (existing) {
    await conn.query(
      `
      UPDATE product_admin_meta
      SET sku = ?, slug = ?, short_description = ?, detail_html = ?, category_id = ?, brand_id = ?,
          list_price = ?, sale_price = ?, cost_price = ?, status = ?, meta_title = ?, meta_description = ?, canonical_url = ?
      WHERE product_id = ?
      `,
      [...commonArgs, productId]
    );
  } else {
    await conn.query(
      `
      INSERT INTO product_admin_meta
      (product_id, sku, slug, short_description, detail_html, category_id, brand_id, list_price, sale_price, cost_price, status, meta_title, meta_description, canonical_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [productId, ...commonArgs]
    );
  }
}

function coalesce(v, ...rest) {
  if (v !== undefined && v !== null && v !== "") return v;
  for (const x of rest) {
    if (x !== undefined && x !== null && x !== "") return x;
  }
  const last = rest[rest.length - 1];
  return last === undefined ? null : last;
}

/** Giống trang chi tiết: có giá gốc > giá bán → % = làm tròn ((gốc − bán)/gốc×100); không thì dùng % nhập tay (badge khi không có gốc). */
function computeDisplayDiscountPercent(originalPriceResolved, retailFinal, variantDiscount) {
  const o = Number(originalPriceResolved);
  const r = Number(retailFinal);
  if (Number.isFinite(o) && o > 0 && Number.isFinite(r) && o > r) {
    return Math.max(0, Math.min(100, Math.round(((o - r) / o) * 100)));
  }
  const d = Number(variantDiscount);
  if (!Number.isFinite(d)) return 0;
  return Math.max(0, Math.min(100, Math.round(d)));
}

/** Giá gốc (gạch ngang): gửi rỗng/null = xóa. */
function resolveIncomingOriginalPrice(variant, existing) {
  if (Object.prototype.hasOwnProperty.call(variant, "originalPrice") || Object.prototype.hasOwnProperty.call(variant, "original_price")) {
    const p = variant.originalPrice !== undefined ? variant.originalPrice : variant.original_price;
    if (p === null || p === "" || (typeof p === "string" && p.trim() === "")) return null;
    const n = Number(p);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }
  if (existing != null && existing !== "") {
    const n = Number(existing);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

async function loadVariantRow(conn, vid, productId) {
  if (!Number.isInteger(vid) || vid <= 0) return {};
  const [[row]] = await conn.query(`SELECT * FROM product_variants WHERE id = ? AND product_id = ? LIMIT 1`, [vid, productId]);
  return row || {};
}

async function persistOneVariant(conn, productId, variant, settings, role) {
  const vid = variant.id != null ? Number(variant.id) : NaN;
  const existing = Number.isInteger(vid) && vid > 0 ? await loadVariantRow(conn, vid, productId) : {};
  const canCost = canEditCostAndImport(role);

  const originalPriceResolved = resolveIncomingOriginalPrice(variant, existing.original_price);
  const mergedForPricing = {
    import_price: canCost
      ? coalesce(variant.importPrice, variant.import_price, existing.import_price, 0)
      : Number(existing.import_price || 0),
    logistics_cost: canCost
      ? coalesce(variant.logisticsCost, variant.logistics_cost, existing.logistics_cost, 0)
      : Number(existing.logistics_cost || 0),
    operational_cost: canCost
      ? coalesce(variant.operationalCost, variant.operational_cost, existing.operational_cost, 0)
      : Number(existing.operational_cost || 0),
    cost_price: canCost ? coalesce(variant.costPrice, variant.cost_price, existing.cost_price, null) : existing.cost_price,
    vat_rate: coalesce(variant.vatRate, variant.vat_rate, existing.vat_rate, settings.default_vat_rate),
    target_margin_percent: coalesce(
      variant.targetMarginPercent,
      variant.target_margin_percent,
      existing.target_margin_percent,
      null
    ),
    retail_price: coalesce(variant.retailPrice, variant.retail_price, variant.price, existing.retail_price, existing.price, 0),
    rounding_rule: coalesce(variant.roundingRule, variant.rounding_rule, existing.rounding_rule, settings.default_rounding_rule),
    allow_loss_override: canCost
      ? Boolean(variant.allowLossOverride ?? variant.allow_loss_override ?? existing.allow_loss_override)
      : Boolean(existing.allow_loss_override),
    wholesale_price: coalesce(variant.wholesalePrice, variant.wholesale_price, existing.wholesale_price, null),
    price_before_tax: coalesce(variant.priceBeforeTax, variant.price_before_tax, existing.price_before_tax, null),
  };

  const fin = computeVariantPricing(mergedForPricing, settings);

  const color = coalesce(variant.color, existing.color, null);
  const ram = coalesce(variant.ram, existing.ram, null);
  const storage = coalesce(variant.storage, existing.storage, null);
  const version = coalesce(variant.version, existing.version, null);
  const discount = computeDisplayDiscountPercent(
    originalPriceResolved,
    fin.retail_price,
    coalesce(variant.discount, existing.discount, 0)
  );
  const stock = Number(coalesce(variant.stock, existing.stock, 0));
  const skuRaw = coalesce(variant.sku, existing.sku, null);
  const sku = normalizeSku(skuRaw);
  if (!sku) {
    throw new AppError("Thiếu SKU phiên bản — mỗi phiên bản phải có mã SKU duy nhất (dùng nút Gợi ý SKU nếu cần)", 400, "VALIDATION_ERROR");
  }
  const skuFmt = validateSkuFormat(sku);
  if (skuFmt) throw new AppError(skuFmt, 400, "VALIDATION_ERROR");
  await assertSkuFreeForVariant(conn, sku, productId, Number.isInteger(vid) && vid > 0 ? vid : null);
  const lowStock = Number(coalesce(variant.lowStockThreshold, variant.low_stock_threshold, existing.low_stock_threshold, 5));
  const isActive = variant.isActive === false || variant.is_active === 0 ? 0 : 1;

  const baseCols = [color, ram, storage, version, fin.price, discount, stock, sku, lowStock, isActive];
  const finCols = [
    fin.import_price,
    fin.logistics_cost,
    fin.operational_cost,
    fin.cost_price,
    fin.price_before_tax,
    fin.vat_rate,
    fin.vat_amount,
    fin.retail_price,
    originalPriceResolved,
    fin.wholesale_price,
    fin.margin_percent,
    fin.profit_amount,
    fin.target_margin_percent,
    fin.rounding_rule,
    fin.allow_loss_override,
  ];

  if (Number.isInteger(vid) && vid > 0) {
    const [upd] = await conn.query(
      `
      UPDATE product_variants SET
        color=?, ram=?, storage=?, version=?, price=?, discount=?, stock=?, sku=?, low_stock_threshold=?, is_active=?,
        import_price=?, logistics_cost=?, operational_cost=?, cost_price=?, price_before_tax=?, vat_rate=?, vat_amount=?,
        retail_price=?, original_price=?, wholesale_price=?, margin_percent=?, profit_amount=?,
        target_margin_percent=?, rounding_rule=?, allow_loss_override=?
      WHERE id=? AND product_id=?
      `,
      [...baseCols, ...finCols, vid, productId]
    );
    if (upd.affectedRows === 0) {
      await conn.query(
        `
        INSERT INTO product_variants (
          product_id, color, ram, storage, version, price, discount, stock, sku, low_stock_threshold, is_active,
          import_price, logistics_cost, operational_cost, cost_price, price_before_tax, vat_rate, vat_amount, retail_price,
          original_price, wholesale_price, margin_percent, profit_amount, target_margin_percent,
          rounding_rule, allow_loss_override
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `,
        [productId, ...baseCols, ...finCols]
      );
    }
  } else {
    await conn.query(
      `
      INSERT INTO product_variants (
        product_id, color, ram, storage, version, price, discount, stock, sku, low_stock_threshold, is_active,
        import_price, logistics_cost, operational_cost, cost_price, price_before_tax, vat_rate, vat_amount, retail_price,
        original_price, wholesale_price, margin_percent, profit_amount, target_margin_percent,
        rounding_rule, allow_loss_override
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [productId, ...baseCols, ...finCols]
    );
  }
}

async function persistVariants(conn, productId, variantsInput, role) {
  const settings = await adminSettingsService.getPricingSettings();
  const variants = Array.isArray(variantsInput) ? variantsInput : [];
  assertDistinctVariantSkusInPayload(variants);
  for (const variant of variants) {
    await persistOneVariant(conn, productId, variant, settings, role || "admin");
  }
}

async function createAdminProduct(payload, actorRole = "admin", actorId = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const name = payload.name?.trim();
    const brand = payload.brand?.trim();
    if (!name || !brand) throw new AppError("name and brand are required", 400, "VALIDATION_ERROR");

    const categoryId = normalizeCategoryId(payload.categoryId);
    const brandId = await resolveBrandId(conn, brand);

    const [insertProduct] = await conn.query(
      "INSERT INTO products (name, brand, description) VALUES (?, ?, ?)",
      [name, brand, payload.shortDescription ?? payload.description ?? null]
    );
    const productId = insertProduct.insertId;
    const sku = normalizeSku(payload.sku) || suggestProductSku(name, brand);
    const slug = payload.slug?.trim() || slugify(name);

    await assertSkuFreeForProductMeta(conn, sku, productId);

    await conn.query(
      `
      INSERT INTO product_admin_meta
      (product_id, sku, slug, short_description, detail_html, category_id, brand_id, list_price, sale_price, cost_price, status, meta_title, meta_description, canonical_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        productId,
        sku,
        slug,
        payload.shortDescription || null,
        payload.detailHtml || null,
        categoryId,
        brandId,
        Number(payload.listPrice || 0),
        Number(payload.salePrice || 0),
        Number(payload.costPrice || 0),
        payload.status || "active",
        payload.metaTitle || null,
        payload.metaDescription || null,
        payload.canonicalUrl || null,
      ]
    );

    await persistVariants(conn, productId, payload.variants, actorRole);

    await upsertProductSpecs(conn, productId, payload.specs);

    await saveProductImages(conn, productId, payload.images);

    await conn.commit();
    await createAuditLog({
      userId: actorId,
      module: "products",
      action: "create",
      targetType: "product",
      targetId: productId,
      metadata: { name, brand, sku, status: payload.status || "active" },
    });
    return { id: productId, message: "Product created successfully" };
  } catch (error) {
    await conn.rollback();
    const mapped = mapMysqlDuplicateToAppError(error);
    if (mapped) throw mapped;
    throw error;
  } finally {
    conn.release();
  }
}

async function updateAdminProduct(id, payload, actorRole = "admin", actorId = null) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) throw new AppError("Invalid product id", 400, "VALIDATION_ERROR");
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[existing]] = await conn.query("SELECT id FROM products WHERE id = ? LIMIT 1", [productId]);
    if (!existing) throw new AppError("Product not found", 404, "NOT_FOUND");

    const categoryId = normalizeCategoryId(payload.categoryId);
    const brandId = await resolveBrandId(conn, payload.brand);

    await conn.query("UPDATE products SET name = ?, brand = ?, description = ? WHERE id = ?", [
      payload.name,
      payload.brand,
      payload.shortDescription ?? payload.description ?? null,
      productId,
    ]);

    let sku = normalizeSku(payload.sku);
    let slug = payload.slug?.trim();
    if (!sku || !slug) {
      const [[pam]] = await conn.query("SELECT sku, slug FROM product_admin_meta WHERE product_id = ? LIMIT 1", [productId]);
      sku = sku || pam?.sku || suggestProductSku(payload.name || "product", payload.brand || "");
      slug = slug || pam?.slug || slugify(payload.name || "product");
    }
    await assertSkuFreeForProductMeta(conn, sku, productId);
    await upsertProductAdminMeta(conn, productId, payload, sku, slug, categoryId, brandId);

    await persistVariants(conn, productId, payload.variants, actorRole);

    await upsertProductSpecs(conn, productId, payload.specs);

    if (Array.isArray(payload.images) && payload.images.length > 0) {
      await saveProductImages(conn, productId, payload.images);
    }

    await conn.commit();
    await createAuditLog({
      userId: actorId,
      module: "products",
      action: "update",
      targetType: "product",
      targetId: productId,
      metadata: { name: payload.name, brand: payload.brand, status: payload.status || "active" },
    });
    return { id: productId, message: "Product updated successfully" };
  } catch (error) {
    await conn.rollback();
    const mapped = mapMysqlDuplicateToAppError(error);
    if (mapped) throw mapped;
    throw error;
  } finally {
    conn.release();
  }
}

async function getAdminProductById(id) {
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) throw new AppError("Invalid product id", 400, "VALIDATION_ERROR");
  const [[product]] = await pool.query(
    `
      SELECT
        p.id, p.name, p.brand, p.description,
        pam.sku, pam.slug, pam.short_description, pam.detail_html, pam.category_id, pam.list_price, pam.sale_price, pam.cost_price,
        pam.status, pam.meta_title, pam.meta_description, pam.canonical_url
      FROM products p
      LEFT JOIN product_admin_meta pam ON pam.product_id = p.id
      WHERE p.id = ?
      LIMIT 1
    `,
    [productId]
  );
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
  const [variants] = await pool.query(
    `
      SELECT id, color, ram, storage, version, price, discount, stock, sku, low_stock_threshold, is_active,
        import_price, logistics_cost, operational_cost, cost_price, price_before_tax, vat_rate, vat_amount, retail_price,
        original_price, wholesale_price, margin_percent, profit_amount, target_margin_percent,
        rounding_rule, allow_loss_override
      FROM product_variants
      WHERE product_id = ?
      ORDER BY id ASC
    `,
    [productId]
  );
  const [imageRows] = await pool.query(
    `SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
    [productId]
  );
  const imageUrls = (imageRows || []).map((r) => r.image_url).filter(Boolean);

  const [[specsRow]] = await pool.query(`SELECT * FROM product_specs WHERE product_id = ? LIMIT 1`, [productId]);
  const specs = specsRow
    ? {
        cpu: specsRow.cpu || "",
        gpuOnboard: specsRow.gpu_onboard || "",
        gpuDiscrete: specsRow.gpu_discrete || "",
        ram: specsRow.ram || "",
        ramMax: specsRow.ram_max || "",
        storage: specsRow.storage || "",
        storageMax: specsRow.storage_max || "",
        screenSize: specsRow.screen_size || "",
        screenResolution: specsRow.screen_resolution || "",
        screenTechnology: specsRow.screen_technology || "",
        ports: specsRow.ports || "",
        battery: specsRow.battery || "",
        dimensions: specsRow.dimensions || "",
        weight: specsRow.weight || "",
        material: specsRow.material || "",
        wireless: specsRow.wireless || "",
        webcam: specsRow.webcam || "",
        os: specsRow.os || "",
      }
    : null;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    sku: product.sku,
    slug: product.slug,
    shortDescription: product.short_description,
    detailHtml: product.detail_html,
    categoryId: product.category_id != null ? product.category_id : "",
    listPrice: Number(product.list_price || 0),
    salePrice: Number(product.sale_price || 0),
    costPrice: Number(product.cost_price || 0),
    status: product.status || "active",
    metaTitle: product.meta_title,
    metaDescription: product.meta_description,
    canonicalUrl: product.canonical_url,
    imageUrls,
    specs,
    variants: variants.map((v) => ({
      id: v.id,
      color: v.color || "",
      ram: v.ram || "",
      storage: v.storage || "",
      version: v.version || "",
      price: Number(v.price || 0),
      discount: Number(v.discount || 0),
      stock: Number(v.stock || 0),
      sku: v.sku || "",
      lowStockThreshold: Number(v.low_stock_threshold || 5),
      isActive: Number(v.is_active || 0) === 1,
      importPrice: v.import_price != null ? Number(v.import_price) : null,
      logisticsCost: Number(v.logistics_cost || 0),
      operationalCost: Number(v.operational_cost || 0),
      costPrice: v.cost_price != null ? Number(v.cost_price) : null,
      priceBeforeTax: v.price_before_tax != null ? Number(v.price_before_tax) : null,
      vatRate: v.vat_rate != null ? Number(v.vat_rate) : 10,
      vatAmount: v.vat_amount != null ? Number(v.vat_amount) : 0,
      retailPrice: v.retail_price != null ? Number(v.retail_price) : Number(v.price || 0),
      originalPrice: v.original_price != null ? Number(v.original_price) : null,
      wholesalePrice: v.wholesale_price != null ? Number(v.wholesale_price) : null,
      marginPercent: v.margin_percent != null ? Number(v.margin_percent) : null,
      profitAmount: v.profit_amount != null ? Number(v.profit_amount) : null,
      targetMarginPercent: v.target_margin_percent != null ? Number(v.target_margin_percent) : null,
      roundingRule: v.rounding_rule || "round_nearest_1000",
      allowLossOverride: Number(v.allow_loss_override || 0) === 1,
      marginBadgeClass: marginBadgeClass(v.margin_percent),
    })),
  };
}

async function bulkUpdateStatus(ids = [], status = "active", actorId = null) {
  if (!Array.isArray(ids) || ids.length === 0) throw new AppError("ids is required", 400, "VALIDATION_ERROR");
  const cleanIds = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (cleanIds.length === 0) throw new AppError("ids is invalid", 400, "VALIDATION_ERROR");
  await pool.query(
    `UPDATE product_admin_meta SET status = ? WHERE product_id IN (${cleanIds.map(() => "?").join(",")})`,
    [status, ...cleanIds]
  );
  await createAuditLog({
    userId: actorId,
    module: "products",
    action: "bulk_status",
    targetType: "product",
    targetId: cleanIds.join(","),
    metadata: { status, count: cleanIds.length },
  });
  return { message: "Bulk status updated", affected: cleanIds.length };
}

async function bulkDeleteProducts(ids = [], actorId = null) {
  if (!Array.isArray(ids) || ids.length === 0) throw new AppError("ids is required", 400, "VALIDATION_ERROR");
  const cleanIds = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (cleanIds.length === 0) throw new AppError("ids is invalid", 400, "VALIDATION_ERROR");
  await pool.query(`DELETE FROM products WHERE id IN (${cleanIds.map(() => "?").join(",")})`, cleanIds);
  await createAuditLog({
    userId: actorId,
    module: "products",
    action: "bulk_delete",
    targetType: "product",
    targetId: cleanIds.join(","),
    metadata: { count: cleanIds.length },
  });
  return { message: "Bulk delete completed", affected: cleanIds.length };
}

/** Gợi ý SKU thông tin chung (product_admin_meta.sku) — HÃNG + tên rút gọn + hậu tố; tránh trùng variant & nhóm khác. */
async function suggestProductSkuPreview(query = {}) {
  const conn = await pool.getConnection();
  try {
    const productId = query.productId != null ? Number(query.productId) : null;
    const pid = Number.isFinite(productId) && productId > 0 ? productId : null;
    const name = query.name || "";
    const brand = query.brand || "";
    for (let i = 0; i < 40; i += 1) {
      const seed = i === 0 ? name : `${name} ${i}`;
      const candidate = suggestProductSku(seed, brand);
      const rowV = await findVariantBySku(conn, candidate);
      const pamRow = await findProductMetaBySku(conn, candidate);
      const pamConflict = pamRow && (!pid || Number(pamRow.product_id) !== Number(pid));
      if (!rowV && !pamConflict) {
        return {
          sku: candidate,
          pattern: "SKU nhóm: hãng + tên rút gọn + hậu tố số — không trùng với SKU phiên bản",
        };
      }
    }
    const tail = Date.now().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-8);
    const fallback = `PRD${tail}`.replace(/[^A-Z0-9]/g, "").slice(0, 16);
    return { sku: fallback, pattern: "Mã tạm (tránh trùng)" };
  } finally {
    conn.release();
  }
}

/** Gợi ý SKU phiên bản theo thuộc tính + kiểm tra trùng trong DB (query string). */
async function suggestVariantSkuPreview(query = {}) {
  const conn = await pool.getConnection();
  try {
    const productId = query.productId != null ? Number(query.productId) : null;
    const variantId = query.variantId != null ? Number(query.variantId) : null;
    const base = suggestVariantSku({
      brand: query.brand,
      version: query.version,
      ram: query.ram,
      storage: query.storage,
      color: query.color,
      productId: Number.isFinite(productId) && productId > 0 ? productId : null,
      variantId: Number.isFinite(variantId) && variantId > 0 ? variantId : null,
    });
    for (let i = 0; i < 40; i += 1) {
      const candidate =
        i === 0 ? base : `${base.slice(0, 7)}${String(i).padStart(3, "0")}`.slice(0, 10);
      const rowV = await findVariantBySku(conn, candidate, variantId);
      const rowP = await findProductMetaBySku(conn, candidate);
      if (!rowV && !rowP) {
        return {
          sku: candidate,
          pattern:
            "10 ký tự A–Z/0–9: [Dòng 3][CPU/Gen 2][Cấu hình 3 số][Màu 2] — ví dụ X1CG9037NU",
        };
      }
    }
    const tail = Date.now().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-7);
    const fallback = (`LAP${tail}`.padEnd(10, "X")).slice(0, 10);
    return { sku: fallback, pattern: "Mã tạm 10 ký tự (tránh trùng)" };
  } finally {
    conn.release();
  }
}

module.exports = {
  getAdminProducts,
  createAdminProduct,
  getAdminProductById,
  updateAdminProduct,
  bulkUpdateStatus,
  bulkDeleteProducts,
  suggestVariantSkuPreview,
  suggestProductSkuPreview,
};
