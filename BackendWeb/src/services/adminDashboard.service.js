const pool = require("../../config/database");

async function safeQuery(query, params = [], fallback = []) {
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    if (error?.code === "ER_NO_SUCH_TABLE") return fallback;
    throw error;
  }
}

async function getKpis() {
  const [todayRevenue = { value: 0 }] = await safeQuery(
    `
      SELECT COALESCE(SUM(total_amount), 0) AS value
      FROM orders
      WHERE DATE(created_at) = CURDATE()
        AND status IN ('accepted', 'delivered')
    `
  );
  const [newOrders = { value: 0 }] = await safeQuery(
    `
      SELECT COUNT(*) AS value
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `
  );
  let lowStock = { value: 0 };
  try {
    const [row = { value: 0 }] = await safeQuery(
      `
        SELECT COUNT(*) AS value
        FROM product_variants
        WHERE stock <= COALESCE(low_stock_threshold, 5)
      `
    );
    lowStock = row;
  } catch (error) {
    if (error?.code === "ER_BAD_FIELD_ERROR") {
      const [fallback = { value: 0 }] = await safeQuery(
        `
          SELECT COUNT(*) AS value
          FROM product_variants
          WHERE stock <= 5
        `
      );
      lowStock = fallback;
    } else {
      throw error;
    }
  }
  const [newCustomers = { value: 0 }] = await safeQuery(
    `
      SELECT COUNT(*) AS value
      FROM customers
      WHERE DATE(created_at) = CURDATE()
    `
  );

  return {
    todayRevenue: Number(todayRevenue.value || 0),
    newOrders: Number(newOrders.value || 0),
    lowStockProducts: Number(lowStock.value || 0),
    newCustomers: Number(newCustomers.value || 0),
  };
}

async function getRevenueSeries(days = 7) {
  const span = Math.max(1, Number(days) || 7);
  const rows = await safeQuery(
    `
      SELECT DATE_FORMAT(DATE(created_at), '%d/%m') AS day, COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND status IN ('accepted', 'delivered')
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `,
    [Math.max(0, span - 1)]
  );
  return rows.map((row) => ({
    day: row.day,
    revenue: Number(row.revenue || 0),
  }));
}

async function getTopProducts(limit = 5) {
  const rows = await safeQuery(
    `
      SELECT
        p.id,
        p.name,
        SUM(oi.quantity) AS sold,
        SUM(oi.quantity * oi.unit_price) AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('accepted', 'delivered')
      GROUP BY p.id, p.name
      ORDER BY sold DESC
      LIMIT ?
    `,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sold: Number(row.sold || 0),
    revenue: Number(row.revenue || 0),
  }));
}

async function getRecentOrders(limit = 5) {
  const rows = await safeQuery(
    `
      SELECT id, order_code, customer_name, total_amount, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT ?
    `,
    [limit]
  );
  return rows.map((row) => ({
    id: row.id,
    code: row.order_code,
    customerName: row.customer_name,
    totalAmount: Number(row.total_amount || 0),
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function getPendingOrdersCount() {
  const [row = { value: 0 }] = await safeQuery(
    `
      SELECT COUNT(*) AS value
      FROM orders
      WHERE status = 'pending'
    `
  );
  return Number(row.value || 0);
}

async function getRecentPendingOrdersPreview(limit = 8) {
  const rows = await safeQuery(
    `
    SELECT id, order_code AS code, customer_name AS customerName, created_at AS createdAt
    FROM orders
    WHERE status = 'pending'
    ORDER BY created_at DESC, id DESC
    LIMIT ?
    `,
    [limit],
    []
  );
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    customerName: r.customerName,
    createdAt: r.createdAt,
  }));
}

async function getRevenueCompare() {
  const [today = { v: 0 }] = await safeQuery(
    `SELECT COALESCE(SUM(total_amount),0) AS v FROM orders WHERE DATE(created_at)=CURDATE() AND status IN ('accepted','delivered')`
  );
  const [week = { v: 0 }] = await safeQuery(
    `SELECT COALESCE(SUM(total_amount),0) AS v FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status IN ('accepted','delivered')`
  );
  const [month = { v: 0 }] = await safeQuery(
    `SELECT COALESCE(SUM(total_amount),0) AS v FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status IN ('accepted','delivered')`
  );
  const [todayPrev = { v: 0 }] = await safeQuery(
    `SELECT COALESCE(SUM(total_amount),0) AS v FROM orders WHERE DATE(created_at)=DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status IN ('accepted','delivered')`
  );
  return {
    today: Number(today.v || 0),
    week: Number(week.v || 0),
    month: Number(month.v || 0),
    todayPrev: Number(todayPrev.v || 0),
  };
}

async function getAvgMarginSample() {
  const [row = { m: null }] = await safeQuery(
    `SELECT AVG(margin_percent) AS m FROM product_variants WHERE margin_percent IS NOT NULL`,
    [],
    [{ m: null }]
  );
  return row.m != null ? Number(row.m) : null;
}

async function getCriticalStock() {
  const rows = await safeQuery(`SELECT COUNT(*) AS c FROM product_variants WHERE stock < 3`, [], [{ c: 0 }]);
  return Number(rows[0]?.c || 0);
}

async function getSupplierDebtSummary() {
  const rows = await safeQuery(
    `
    SELECT COALESCE(SUM(remaining_amount),0) AS total
    FROM warehouse_receipts
    WHERE status='confirmed' AND payment_status != 'paid'
    `,
    [],
    [{ total: 0 }]
  );
  return Number(rows[0]?.total || 0);
}

async function getTopProductsByRevenue(limit = 5) {
  const rows = await safeQuery(
    `
    SELECT p.id, p.name, SUM(oi.quantity * oi.unit_price) AS revenue, SUM(oi.quantity) AS sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status IN ('accepted','delivered')
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
    LIMIT ?
    `,
    [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    revenue: Number(r.revenue || 0),
    sold: Number(r.sold || 0),
  }));
}

async function getAdminDashboardOverview() {
  const [
    kpis,
    revenue7d,
    revenue30d,
    topProducts,
    recentOrders,
    pendingOrders,
    pendingOrdersPreview,
    revenueCompare,
    avgMargin,
    criticalStock,
    supplierDebt,
    topByRevenue,
  ] = await Promise.all([
    getKpis(),
    getRevenueSeries(7),
    getRevenueSeries(30),
    getTopProducts(5),
    getRecentOrders(5),
    getPendingOrdersCount(),
    getRecentPendingOrdersPreview(8),
    getRevenueCompare(),
    getAvgMarginSample(),
    getCriticalStock(),
    getSupplierDebtSummary(),
    getTopProductsByRevenue(5),
  ]);

  return {
    kpis,
    charts: {
      revenue7d,
      revenue30d,
    },
    topProducts,
    topProductsByRevenue: topByRevenue,
    recentOrders,
    pendingOrders,
    pendingOrdersPreview,
    enterprise: {
      revenueCompare,
      avgMarginPercent: avgMargin,
      criticalStockUnder3: criticalStock,
      supplierDebtOpen: supplierDebt,
    },
  };
}

module.exports = { getAdminDashboardOverview };
