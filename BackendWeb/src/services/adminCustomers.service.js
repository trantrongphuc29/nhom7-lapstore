const pool = require("../../config/database");
const AppError = require("../utils/AppError");
const { createAuditLog } = require("./adminAudit.service");

function isPgSchemaError(error) {
  const code = String(error?.code || "");
  return code === "42P01" || code === "42703";
}

/** orders.customer_id references customers.id, not users.id */
const CUSTOMER_ORDER_SPENT_SQL = `
  COALESCE(
    (
      SELECT SUM(o.total_amount)
      FROM orders o
      WHERE o.customer_id = c.id
        AND o.status IN ('accepted', 'delivered')
    ),
    c.total_spent,
    0
  )
`;

async function getAdminCustomers(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(query.limit) || 10));
  const offset = (page - 1) * limit;
  const status = query.status?.trim() || "";
  const search = query.search?.trim() || "";
  const values = [];
  let where = " WHERE 1=1 ";
  if (status) {
    where += " AND COALESCE(c.status, 'active') = ? ";
    values.push(status);
  }
  if (search) {
    where += " AND (COALESCE(c.full_name, '') LIKE ? OR u.email LIKE ? OR COALESCE(c.phone, '') LIKE ?) ";
    const keyword = `%${search}%`;
    values.push(keyword, keyword, keyword);
  }
  let count;
  let rows;
  try {
    [[count]] = await pool.query(
      `
        SELECT COUNT(*) AS total
        FROM users u
        LEFT JOIN customers c ON c.user_id = u.id
        ${where}
      `,
      values
    );
    [rows] = await pool.query(
      `
        SELECT
          u.id,
          COALESCE(c.full_name, SPLIT_PART(u.email, '@', 1)) AS fullName,
          u.email,
          c.phone,
          COALESCE(c.status, 'active') AS status,
          COALESCE(c.customer_group, 'retail') AS customerGroup,
          COALESCE(c.loyalty_points, 0) AS loyaltyPoints,
          ${CUSTOMER_ORDER_SPENT_SQL} AS totalSpent,
          COALESCE(c.created_at, u.created_at) AS createdAt
        FROM users u
        LEFT JOIN customers c ON c.user_id = u.id
        ${where}
        ORDER BY u.id DESC
        LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );
  } catch (error) {
    if (!isPgSchemaError(error)) throw error;
    const [{ total = 0 } = {}] = await pool.query(`SELECT COUNT(*) AS total FROM users`);
    count = { total };
    [rows] = await pool.query(
      `
        SELECT
          u.id,
          SPLIT_PART(u.email, '@', 1) AS fullName,
          u.email,
          NULL AS phone,
          'active' AS status,
          'retail' AS customerGroup,
          0 AS loyaltyPoints,
          0 AS totalSpent,
          u.created_at AS createdAt
        FROM users u
        ORDER BY u.id DESC
        LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );
  }
  return {
    records: rows.map((r) => ({ ...r, totalSpent: Number(r.totalSpent || 0), loyaltyPoints: Number(r.loyaltyPoints || 0) })),
    pagination: {
      total: Number(count.total || 0),
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(Number(count.total || 0) / limit)),
    },
  };
}

async function getAdminCustomerById(id) {
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) throw new AppError("Invalid customer id", 400, "VALIDATION_ERROR");
  let customer;
  try {
    [[customer]] = await pool.query(
      `
        SELECT
          u.id,
          COALESCE(c.full_name, SPLIT_PART(u.email, '@', 1)) AS fullName,
          u.email,
          c.phone,
          COALESCE(c.status, 'active') AS status,
          COALESCE(c.customer_group, 'retail') AS customerGroup,
          COALESCE(c.loyalty_points, 0) AS loyaltyPoints,
          ${CUSTOMER_ORDER_SPENT_SQL} AS totalSpent,
          COALESCE(c.created_at, u.created_at) AS createdAt
        FROM users u
        LEFT JOIN customers c ON c.user_id = u.id
        WHERE u.id = ?
        LIMIT 1
      `,
      [userId]
    );
  } catch (error) {
    if (!isPgSchemaError(error)) throw error;
    [[customer]] = await pool.query(
      `
        SELECT
          u.id,
          SPLIT_PART(u.email, '@', 1) AS fullName,
          u.email,
          NULL AS phone,
          'active' AS status,
          'retail' AS customerGroup,
          0 AS loyaltyPoints,
          0 AS totalSpent,
          u.created_at AS createdAt
        FROM users u
        WHERE u.id = ?
        LIMIT 1
      `,
      [userId]
    );
  }
  if (!customer) throw new AppError("Customer not found", 404, "NOT_FOUND");
  const [recentOrders] = await pool.query(
    `
      SELECT id, order_code AS code, total_amount AS totalAmount, status, created_at AS createdAt
      FROM orders
      WHERE customer_id IN (SELECT id FROM customers WHERE user_id = ?)
      ORDER BY created_at DESC
      LIMIT 10
    `,
    [userId]
  );
  return {
    ...customer,
    totalSpent: Number(customer.totalSpent || 0),
    loyaltyPoints: Number(customer.loyaltyPoints || 0),
    recentOrders: recentOrders.map((o) => ({ ...o, totalAmount: Number(o.totalAmount || 0) })),
  };
}

async function updateAdminCustomerStatus(id, payload, actorId = null) {
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) throw new AppError("Invalid customer id", 400, "VALIDATION_ERROR");
  const status = payload.status;
  if (!["active", "blocked"].includes(status)) throw new AppError("Invalid customer status", 400, "VALIDATION_ERROR");
  const [[exists]] = await pool.query("SELECT id FROM customers WHERE user_id = ? LIMIT 1", [userId]);
  if (exists) {
    await pool.query("UPDATE customers SET status = ? WHERE user_id = ?", [status, userId]);
  } else {
    const [[u]] = await pool.query("SELECT email, created_at FROM users WHERE id = ? LIMIT 1", [userId]);
    if (!u) throw new AppError("Customer not found", 404, "NOT_FOUND");
    await pool.query(
      `
      INSERT INTO customers (user_id, full_name, email, phone, status, customer_group, loyalty_points, total_spent, created_at)
      VALUES (?, ?, ?, ?, ?, 'retail', 0, 0, ?)
      `,
      [userId, String(u.email || "").split("@")[0], u.email, null, status, u.created_at]
    );
  }
  await createAuditLog({
    userId: actorId,
    module: "customers",
    action: "update_status",
    targetType: "customer",
    targetId: userId,
    metadata: { status },
  });
  return { id: userId, message: "Customer status updated successfully" };
}

module.exports = { getAdminCustomers, getAdminCustomerById, updateAdminCustomerStatus };
