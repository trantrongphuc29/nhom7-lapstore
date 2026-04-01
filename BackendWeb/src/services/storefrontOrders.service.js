const pool = require("../../config/database");
const AppError = require("../utils/AppError");
const vouchersService = require("./vouchers.service");

const FREE_SHIPPING_THRESHOLD = 10_000_000;
const DEFAULT_SHIPPING_FEE = 50_000;

const PICKUP_STORES = [
  { id: "hcm-q1", label: "LAPSTORE Quận 1 — 123 Nguyễn Huệ, Q.1, TP.HCM" }
];
const { ordersTableHasUserIdColumn } = require("../utils/ordersSchema.util");

function storeLabel(id) {
  return PICKUP_STORES.find((s) => s.id === id)?.label ?? id ?? "";
}

/** Khớp CHECK payment_method trên PostgreSQL: cod | bank_transfer | card | e_wallet */
function mapPaymentMethod(raw) {
  const m = String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
  if (m === "bank" || m === "bank_transfer" || m === "transfer") return "bank_transfer";
  if (m === "card" || m === "credit" || m === "debit") return "card";
  if (m === "e_wallet" || m === "ewallet" || m === "momo" || m === "zalopay" || m === "vnpay") return "e_wallet";
  return "cod";
}

function truncate(s, max) {
  const str = String(s || "");
  if (str.length <= max) return str;
  return `${str.slice(0, max - 1)}…`;
}

/** @param {object} shipping Frontend checkoutFlow shape */
function buildShippingAddress(shipping) {
  if (shipping.fulfillment === "pickup") {
    const store = storeLabel(shipping.pickupStoreId);
    const name = shipping.pickupName?.trim() || "";
    const phone = shipping.pickupPhone?.trim() || "";
    return truncate(`[Nhận tại cửa hàng] ${store} | ${name} | ${phone}`, 255);
  }
  const name = shipping.shipName?.trim() || "";
  const phone = shipping.shipPhone?.trim() || "";
  const region = shipping.shipRegion?.trim() || "";
  const addr = shipping.shipAddress?.trim() || "";
  return truncate(`[Giao tận nơi] ${name} | ${phone} | ${region} | ${addr}`, 255);
}

async function generateOrderCode() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const rnd = String(Math.floor(Math.random() * 900000) + 100000);
    const code = `LS-${year}-${rnd}`;
    const [[row]] = await pool.query("SELECT id FROM orders WHERE order_code = ? LIMIT 1", [code]);
    if (!row) return code;
  }
  return `LS-${year}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * @param {object} body
 * @param {object|null} authUser req.user từ optionalVerifyToken (JWT) hoặc null
 */
async function createStorefrontOrder(body, authUser) {
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Giỏ hàng không có sản phẩm", 400, "VALIDATION_ERROR");
  }
  const shipping = body.shipping;
  if (!shipping || typeof shipping !== "object" || !shipping.fulfillment) {
    throw new AppError("Thiếu thông tin nhận hàng", 400, "VALIDATION_ERROR");
  }

  let customerName;
  let customerPhone;
  if (shipping.fulfillment === "pickup") {
    customerName = String(shipping.pickupName || "").trim();
    customerPhone = String(shipping.pickupPhone || "").trim();
    if (!shipping.pickupStoreId) throw new AppError("Chưa chọn cửa hàng", 400, "VALIDATION_ERROR");
  } else {
    customerName = String(shipping.shipName || "").trim();
    customerPhone = String(shipping.shipPhone || "").trim();
    if (!String(shipping.shipRegion || "").trim() || !String(shipping.shipAddress || "").trim()) {
      throw new AppError("Thiếu địa chỉ giao hàng", 400, "VALIDATION_ERROR");
    }
  }
  if (!customerName || !customerPhone) {
    throw new AppError("Thiếu họ tên hoặc số điện thoại người nhận", 400, "VALIDATION_ERROR");
  }
  if (customerPhone.replace(/\D/g, "").length < 9) {
    throw new AppError("Số điện thoại không hợp lệ", 400, "VALIDATION_ERROR");
  }

  const rawUid = !authUser ? null : Number(authUser.sub);
  const uid = Number.isInteger(rawUid) && rawUid > 0 ? rawUid : null;
  const canWriteOrderUserId = await ordersTableHasUserIdColumn(pool);

  let customerEmail = null;
  let customerId = null;
  if (uid) {
    const [[u]] = await pool.query("SELECT email FROM users WHERE id = ? LIMIT 1", [uid]);
    if (u?.email) customerEmail = u.email;
    const [[c]] = await pool.query("SELECT id FROM customers WHERE user_id = ? LIMIT 1", [uid]);
    if (c?.id) customerId = Number(c.id);
  }

  const address = buildShippingAddress(shipping);
  const paymentMethod = mapPaymentMethod(body.paymentMethod);

  const lines = [];
  let subtotal = 0;

  for (const line of items) {
    const pid = Number(line.productId);
    const vid = Number(line.variantId);
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 1));
    if (!Number.isInteger(pid) || pid <= 0 || !Number.isInteger(vid) || vid <= 0) {
      throw new AppError("Dòng giỏ hàng không hợp lệ", 400, "VALIDATION_ERROR");
    }

    const [[row]] = await pool.query(
      `
      SELECT pv.id, pv.product_id, pv.price, pv.stock, pv.ram, pv.storage, pv.color, pv.version,
             p.name AS product_name
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = ? AND pv.product_id = ?
      LIMIT 1
      `,
      [vid, pid]
    );
    if (!row) {
      throw new AppError(`Sản phẩm #${pid} (phiên bản #${vid}) không tồn tại`, 400, "NOT_FOUND");
    }

    const stock = Number(row.stock) || 0;
    if (stock < qty) {
      throw new AppError(`Không đủ hàng: ${row.product_name}`, 400, "OUT_OF_STOCK");
    }

    const unit = Number(row.price) || 0;
    subtotal += unit * qty;

    const variantName =
      String(line.specSummary || line.variantSummary || "").trim() ||
      [row.ram, row.storage, row.color, row.version].filter(Boolean).join(" / ") ||
      null;

    const productName = String(line.name || row.product_name || "").trim() || row.product_name;

    lines.push({
      productId: pid,
      variantId: vid,
      productName: truncate(productName, 255),
      variantName: variantName ? truncate(variantName, 255) : null,
      quantity: qty,
      unitPrice: unit,
    });
  }

  let discountAmount = 0;
  let voucherCodeForRedeem = null;
  const rawVoucher = body.voucherCode != null ? String(body.voucherCode).trim() : "";
  if (rawVoucher) {
    const preview = await vouchersService.previewVoucher(rawVoucher, subtotal);
    discountAmount = preview.discountAmount;
    voucherCodeForRedeem = preview.code;
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const orderCode = await generateOrderCode();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const l of lines) {
      const [stockRes] = await conn.query(
        `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`,
        [l.quantity, l.variantId, l.quantity]
      );
      if (!stockRes || Number(stockRes.affectedRows || 0) !== 1) {
        throw new AppError(`Không đủ hàng: ${l.productName}`, 400, "OUT_OF_STOCK");
      }
    }

    const [ins] = canWriteOrderUserId
      ? await conn.query(
          `
        INSERT INTO orders (
          order_code, customer_id, user_id, sales_user_id,
          customer_name, customer_email, customer_phone, shipping_address,
          payment_method, sales_channel, status,
          subtotal, discount_amount, shipping_fee, total_amount, internal_note
        )
        VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 'web', 'pending', ?, ?, ?, ?, NULL)
        `,
          [
            orderCode,
            customerId,
            uid,
            truncate(customerName, 150),
            customerEmail ? truncate(customerEmail, 120) : null,
            truncate(customerPhone, 20),
            address,
            paymentMethod,
            subtotal,
            discountAmount,
            shippingFee,
            totalAmount,
          ]
        )
      : await conn.query(
          `
        INSERT INTO orders (
          order_code, customer_id, sales_user_id,
          customer_name, customer_email, customer_phone, shipping_address,
          payment_method, sales_channel, status,
          subtotal, discount_amount, shipping_fee, total_amount, internal_note
        )
        VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'web', 'pending', ?, ?, ?, ?, NULL)
        `,
          [
            orderCode,
            customerId,
            truncate(customerName, 150),
            customerEmail ? truncate(customerEmail, 120) : null,
            truncate(customerPhone, 20),
            address,
            paymentMethod,
            subtotal,
            discountAmount,
            shippingFee,
            totalAmount,
          ]
        );

    const orderId = ins.insertId;
    if (!orderId) {
      throw new AppError("Không tạo được đơn hàng", 500, "ORDER_CREATE_FAILED");
    }

    for (const l of lines) {
      await conn.query(
        `
        INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [orderId, l.productId, l.variantId, l.productName, l.variantName, l.quantity, l.unitPrice]
      );
    }

    await conn.query(
      `INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, 'pending', ?, NULL)`,
      [orderId, "Đặt hàng từ website"]
    );

    if (voucherCodeForRedeem) {
      await vouchersService.redeemVoucher(voucherCodeForRedeem, subtotal, (sql, params) => conn.query(sql, params));
    }

    await conn.commit();

    return {
      orderId,
      orderCode,
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount,
      status: "pending",
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { createStorefrontOrder, FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_FEE };
