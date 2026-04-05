const pool = require("../../config/database");

function isPgSchemaError(error) {
  const code = String(error?.code || "");
  return code === "42P01" || code === "42703";
}

async function createAuditLog({ userId = null, module, action, targetType = null, targetId = null, metadata = null }) {
  try {
    await pool.query(
      `
        INSERT INTO admin_audit_logs (user_id, module, action, target_type, target_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [userId, module, action, targetType, targetId != null ? String(targetId) : null, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    // Audit log must never break the main flow.
  }
}

async function getAuditLogs(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(query.limit) || 20));
  const offset = (page - 1) * limit;
  const moduleFilter = query.module?.trim() || "";
  const actionFilter = query.action?.trim() || "";
  const userFilter = query.user?.trim() || "";
  const search = query.search?.trim() || "";
  const values = [];
  let where = " WHERE 1=1 ";
  if (moduleFilter) {
    where += " AND l.module = ? ";
    values.push(moduleFilter);
  }
  if (actionFilter) {
    where += " AND l.action = ? ";
    values.push(actionFilter);
  }
  if (userFilter) {
    where += " AND u.email LIKE ? ";
    values.push(`%${userFilter}%`);
  }
  if (search) {
    where += " AND (l.module LIKE ? OR l.action LIKE ? OR l.target_type LIKE ? OR l.target_id LIKE ? OR COALESCE(u.email, '') LIKE ?) ";
    const kw = `%${search}%`;
    values.push(kw, kw, kw, kw, kw);
  }
  const fromJoin = `
    FROM admin_audit_logs l
    LEFT JOIN users u ON u.id = l.user_id
  `;
  let countRows;
  let rows;
  try {
    [countRows] = await pool.query(`SELECT COUNT(*) AS total ${fromJoin} ${where}`, values);
    [rows] = await pool.query(
      `
        SELECT l.id, l.user_id AS userId, u.email AS userEmail, l.module, l.action, l.target_type AS targetType, l.target_id AS targetId, l.metadata, l.created_at AS createdAt
        ${fromJoin}
        ${where}
        ORDER BY l.id DESC
        LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );
  } catch (error) {
    if (!isPgSchemaError(error)) throw error;
    countRows = [{ total: 0 }];
    rows = [];
  }
  return {
    records: rows.map((r) => {
      let parsed = null;
      if (r.metadata != null && r.metadata !== "") {
        try {
          parsed = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
        } catch {
          parsed = null;
        }
      }
      return { ...r, metadata: parsed };
    }),
    pagination: {
      total: Number(countRows[0]?.total || 0),
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(Number(countRows[0]?.total || 0) / limit)),
    },
  };
}

module.exports = { createAuditLog, getAuditLogs };
