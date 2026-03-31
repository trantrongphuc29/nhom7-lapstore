const pool = require("../../config/database");
const AppError = require("../utils/AppError");
const { createAuditLog } = require("./adminAudit.service");

async function safeQuery(query, params = [], fallback = []) {
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    if (error?.code === "ER_NO_SUCH_TABLE") return fallback;
    throw error;
  }
}

async function getAdminOrders(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(query.limit) || 10));
  const offset = (page - 1) * limit;
  const status = query.status?.trim() || "";
  const search = query.search?.trim() || "";
  const dateFrom = query.dateFrom?.trim() || "";
  const dateTo = query.dateTo?.trim() || "";
  const values = [];
  let where = " WHERE 1=1 ";
  if (status) {
    where += " AND o.status = ? ";
    values.push(status);
  }
  if (search) {
    where += " AND (o.order_code LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?) ";
    const keyword = `%${search}%`;
    values.push(keyword, keyword, keyword);
  }
  if (dateFrom) {
    where += " AND DATE(o.created_at) >= ? ";
    values.push(dateFrom);
  }
  if (dateTo) {
    where += " AND DATE(o.created_at) <= ? ";
    values.push(dateTo);
  }

  const [countRow = { total: 0 }] = await safeQuery(
    `SELECT COUNT(*) AS total FROM orders o ${where}`,
    values,
    [{ total: 0 }]
  );
  const rows = await safeQuery(
    `
      SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.total_amount, o.status, o.payment_method, o.created_at
      FROM orders o
      ${where}
      ORDER BY o.id DESC
      LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  return {
    records: rows.map((row) => ({
      id: row.id,
      code: row.order_code,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      totalAmount: Number(row.total_amount || 0),
      status: row.status,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
    })),
    pagination: {
      total: Number(countRow.total || 0),
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(Number(countRow.total || 0) / limit)),
    },
  };
}

async function getAdminOrderById(id) {
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) throw new AppError("Invalid order id", 400, "VALIDATION_ERROR");
  const [order] = await safeQuery(
    `
      SELECT id, order_code, customer_name, customer_email, customer_phone, shipping_address, payment_method, sales_channel,
        status, subtotal, discount_amount, shipping_fee, total_amount, internal_note, tracking_code, created_at,
        sales_user_id
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    [orderId]
  );
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");

  const items = await safeQuery(
    `
      SELECT id, product_id, variant_id, product_name, variant_name, quantity, unit_price, unit_cost_snapshot
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
    `,
    [orderId]
  );
  const timeline = await safeQuery(
    `
      SELECT id, status, note, changed_by AS changedBy, created_at AS createdAt
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY created_at ASC
    `,
    [orderId]
  );

  return {
    id: order.id,
    code: order.order_code,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    shippingAddress: order.shipping_address,
    paymentMethod: order.payment_method,
    salesChannel: order.sales_channel,
    status: order.status,
    subtotal: Number(order.subtotal || 0),
    discountAmount: Number(order.discount_amount || 0),
    voucherDiscountAmount: Number(order.discount_amount || 0),
    shippingFee: Number(order.shipping_fee || 0),
    totalAmount: Number(order.total_amount || 0),
    internalNote: order.internal_note,
    trackingCode: order.tracking_code,
    createdAt: order.created_at,
    salesUserId: order.sales_user_id != null ? Number(order.sales_user_id) : null,
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      productName: item.product_name,
      variantName: item.variant_name,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      unitCostSnapshot: item.unit_cost_snapshot != null ? Number(item.unit_cost_snapshot) : null,
    })),
    timeline: timeline.map((t) => ({
      id: t.id,
      status: t.status,
      note: t.note,
      changedBy: t.changedBy,
      createdAt: t.createdAt,
    })),
  };
}

async function updateAdminOrderStatus(id, payload, actorId = null) {
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) throw new AppError("Invalid order id", 400, "VALIDATION_ERROR");
  const status = payload.status;
  if (!status) throw new AppError("status is required", 400, "VALIDATION_ERROR");

  const [current] = await safeQuery("SELECT status FROM orders WHERE id = ? LIMIT 1", [orderId]);
  if (!current) throw new AppError("Order not found", 404, "NOT_FOUND");
  const transitions = {
    pending: ["accepted"],
    accepted: ["delivered"],
    delivered: [],
  };
  const allowed = transitions[current.status] || [];
  if (current.status !== status && !allowed.includes(status)) {
    throw new AppError(`Invalid status transition: ${current.status} -> ${status}`, 400, "INVALID_STATUS_TRANSITION");
  }

  await pool.query("UPDATE orders SET status = ?, tracking_code = ?, internal_note = ? WHERE id = ?", [
    status,
    payload.trackingCode || null,
    payload.internalNote || null,
    orderId,
  ]);
  await pool.query(
    "INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, ?, ?, ?)",
    [orderId, status, payload.note || null, actorId]
  );
  await createAuditLog({
    userId: actorId,
    module: "orders",
    action: "update_status",
    targetType: "order",
    targetId: orderId,
    metadata: { from: current.status, to: status, note: payload.note || null },
  });
  return { id: orderId, message: "Order status updated successfully" };
}

module.exports = {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
};
