const pool = require("../config/database");

function parseSnapshot(raw) {
  if (raw == null) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

class UserCartItem {
  static rowToLine(row) {
    const snap = parseSnapshot(row.snapshot);
    const pid = Number(row.product_id);
    const vid = Number(row.variant_id);
    const fallbackImage = row.fallback_image || null;
    return {
      lineId: snap.lineId || `${pid}-${vid}`,
      productId: pid,
      variantId: vid,
      name: snap.name || "",
      image: snap.image || fallbackImage || null,
      specSummary: snap.specSummary || "",
      price: Number(snap.price) || 0,
      stock: Number(snap.stock) || 0,
      quantity: Math.max(1, Number(row.quantity) || 1),
      color: snap.color,
    };
  }

  static async listByUserId(userId) {
    const [rows] = await pool.query(
      `
      SELECT
        uci.product_id,
        uci.variant_id,
        uci.quantity,
        uci.snapshot,
        COALESCE(
          (SELECT pi.image_url
           FROM product_images pi
           WHERE pi.product_id = uci.product_id
           ORDER BY pi.is_main DESC, pi.sort_order ASC, pi.id ASC
           LIMIT 1),
          NULLIF(TRIM(pv.image), '')
        ) AS fallback_image
      FROM user_cart_items uci
      LEFT JOIN product_variants pv ON pv.id = uci.variant_id
      WHERE uci.user_id = ?
      ORDER BY uci.id ASC
      `,
      [userId]
    );
    return rows.map((r) => this.rowToLine(r));
  }

  static async replaceForUser(userId, lines) {
    if (!Array.isArray(lines)) return [];
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM user_cart_items WHERE user_id = ?", [userId]);
      for (const line of lines) {
        const pid = Number(line.productId ?? line.product_id);
        const vid = Number(line.variantId ?? line.variant_id);
        if (!pid || !vid) continue;
        const qty = Math.max(1, Math.floor(Number(line.quantity) || 1));
        const snapshot = {
          lineId: line.lineId || `${pid}-${vid}`,
          name: line.name,
          image: line.image,
          specSummary: line.specSummary,
          price: line.price,
          stock: line.stock,
          color: line.color,
        };
        await conn.query(
          `INSERT INTO user_cart_items (user_id, product_id, variant_id, quantity, snapshot) VALUES (?, ?, ?, ?, ?)`,
          [userId, pid, vid, qty, JSON.stringify(snapshot)]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    return this.listByUserId(userId);
  }
}

module.exports = UserCartItem;
