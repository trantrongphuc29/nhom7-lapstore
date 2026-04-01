const bcrypt = require("bcryptjs");
const AuthUser = require("../../models/AuthUser");
const UserAddress = require("../../models/UserAddress");
const UserCartItem = require("../../models/UserCartItem");
const AppError = require("../utils/AppError");
const pool = require("../../config/database");
let cachedHasOrdersUserIdColumn = null;

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || null,
    phone: row.phone || null,
  };
}

async function getCustomerByUserId(userId) {
  const [[row]] = await pool.query(
    `SELECT full_name AS fullName, phone
     FROM customers
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  return row || null;
}

async function hasOrdersUserIdColumn() {
  if (cachedHasOrdersUserIdColumn != null) return cachedHasOrdersUserIdColumn;
  const [rows] = await pool.query(
    `
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'user_id'
      LIMIT 1
    `
  );
  cachedHasOrdersUserIdColumn = rows.length > 0;
  return cachedHasOrdersUserIdColumn;
}

async function getProfile(userId) {
  const row = await AuthUser.findPublicById(userId);
  if (!row) throw new AppError("User not found", 404, "NOT_FOUND");
  const customer = await getCustomerByUserId(userId);
  return {
    id: row.id,
    email: row.email,
    fullName: customer?.fullName || row.full_name || "",
    phone: customer?.phone || row.phone || "",
  };
}

async function updateProfile(userId, body) {
  const row = await AuthUser.updateProfile(userId, {
    fullName: body.fullName,
    phone: body.phone,
  });
  if (!row) throw new AppError("User not found", 404, "NOT_FOUND");
  const nextFull = body.fullName !== undefined ? String(body.fullName).trim() || null : null;
  const nextPhone = body.phone !== undefined ? String(body.phone).trim() || null : null;
  const [[existing]] = await pool.query("SELECT id FROM customers WHERE user_id = ? LIMIT 1", [userId]);
  if (existing) {
    await pool.query("UPDATE customers SET full_name = ?, phone = ?, email = ? WHERE user_id = ?", [
      nextFull || row.email,
      nextPhone,
      row.email,
      userId,
    ]);
  } else {
    await pool.query(
      `
        INSERT INTO customers (user_id, full_name, email, phone, status, customer_group, loyalty_points, total_spent)
        VALUES (?, ?, ?, ?, 'active', 'retail', 0, 0)
      `,
      [userId, nextFull || row.email, row.email, nextPhone]
    );
  }
  const customer = await getCustomerByUserId(userId);
  return {
    id: row.id,
    email: row.email,
    fullName: customer?.fullName || "",
    phone: customer?.phone || "",
  };
}

async function changePassword(userId, body) {
  const { currentPassword, newPassword, confirmPassword } = body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("currentPassword, newPassword, confirmPassword are required", 400, "VALIDATION_ERROR");
  }
  if (newPassword.length < 3) {
    throw new AppError("New password must be at least 3 characters", 400, "VALIDATION_ERROR");
  }
  if (newPassword !== confirmPassword) {
    throw new AppError("Password confirmation does not match", 400, "VALIDATION_ERROR");
  }
  const user = await AuthUser.findById(userId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new AppError("Current password is incorrect", 400, "VALIDATION_ERROR");
  const hash = await bcrypt.hash(newPassword, 10);
  await AuthUser.updatePasswordHash(userId, hash);
  return { message: "Password updated" };
}

async function listAddresses(userId) {
  return UserAddress.listByUserId(userId);
}

async function createAddress(userId, body) {
  return UserAddress.create(userId, body);
}

async function updateAddress(userId, id, body) {
  const updated = await UserAddress.update(Number(id), userId, body);
  if (!updated) throw new AppError("Address not found", 404, "NOT_FOUND");
  return updated;
}

async function deleteAddress(userId, id) {
  const ok = await UserAddress.delete(Number(id), userId);
  if (!ok) throw new AppError("Address not found", 404, "NOT_FOUND");
  return { message: "Deleted" };
}

/** Trả về `status` DB: pending | accepted | delivered (giao diện khách map qua customerOrderStatus). */
async function listOrders(userId) {
  const useUserId = await hasOrdersUserIdColumn();
  const whereByAccount = useUserId
    ? "o.user_id = ?"
    : "EXISTS (SELECT 1 FROM customers c WHERE c.id = o.customer_id AND c.user_id = ?)";
  const [rows] = await pool.query(
    `
    SELECT
      o.id,
      o.order_code AS orderCode,
      o.status,
      o.total_amount AS totalAmount,
      o.discount_amount AS discountAmount,
      o.payment_method AS paymentMethod,
      o.created_at AS createdAt,
      o.customer_name AS customerName,
      o.shipping_address AS shippingAddress,
      (
        SELECT COALESCE(
          (
            SELECT pi.image_url
            FROM order_items oi
            JOIN product_images pi ON pi.product_id = oi.product_id
            WHERE oi.order_id = o.id
            ORDER BY pi.is_main DESC, pi.sort_order ASC, pi.id ASC
            LIMIT 1
          ),
          (
            SELECT NULLIF(TRIM(pv.image), '')
            FROM order_items oi
            JOIN product_variants pv ON pv.id = oi.variant_id
            WHERE oi.order_id = o.id
            LIMIT 1
          )
        )
      ) AS image,
      (
        SELECT STRING_AGG(oi.product_name, ' | ')
        FROM order_items oi
        WHERE oi.order_id = o.id
      ) AS productNames
    FROM orders o
    WHERE ${whereByAccount}
    ORDER BY o.created_at DESC
    `,
    [userId]
  );
  if (!rows.length) return rows;

  const orderIds = rows.map((r) => Number(r.id)).filter((id) => Number.isInteger(id) && id > 0);
  const placeholders = orderIds.map(() => "?").join(",");
  const [itemRows] = await pool.query(
    `
      SELECT
        oi.order_id AS orderId,
        oi.id,
        oi.product_id AS productId,
        oi.variant_id AS variantId,
        oi.product_name AS productName,
        oi.variant_name AS variantName,
        oi.quantity,
        oi.unit_price AS unitPrice,
        COALESCE(
          (
            SELECT pi.image_url
            FROM product_images pi
            WHERE pi.product_id = oi.product_id
            ORDER BY pi.is_main DESC, pi.sort_order ASC, pi.id ASC
            LIMIT 1
          ),
          NULLIF(TRIM(pv.image), '')
        ) AS image
      FROM order_items oi
      LEFT JOIN product_variants pv ON pv.id = oi.variant_id
      WHERE oi.order_id IN (${placeholders})
      ORDER BY oi.order_id DESC, oi.id ASC
    `,
    orderIds
  );

  const itemsByOrder = new Map();
  for (const row of itemRows) {
    const orderId = Number(row.orderId);
    if (!itemsByOrder.has(orderId)) itemsByOrder.set(orderId, []);
    itemsByOrder.get(orderId).push({
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      productName: row.productName || "",
      variantName: row.variantName || "",
      quantity: Number(row.quantity || 0),
      unitPrice: Number(row.unitPrice || 0),
      image: row.image || null,
    });
  }

  return rows.map((o) => ({ ...o, items: itemsByOrder.get(Number(o.id)) || [] }));
}

async function getCart(userId) {
  const items = await UserCartItem.listByUserId(userId);
  return { items };
}

async function putCart(userId, body) {
  const raw = body.items ?? body;
  if (!Array.isArray(raw)) throw new AppError("items must be an array", 400, "VALIDATION_ERROR");
  const items = await UserCartItem.replaceForUser(userId, raw);
  return { items };
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listOrders,
  getCart,
  putCart,
};
