/* eslint-disable import/no-extraneous-dependencies */
const XLSX = require("xlsx");
const pool = require("../../config/database");
const AppError = require("../utils/AppError");
const adminProductsService = require("./adminProducts.service");

function sheetFromAoA(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  return ws;
}

function bookFromSheet(name, rows) {
  const wb = XLSX.utils.book_new();
  const ws = sheetFromAoA(rows);
  XLSX.utils.book_append_sheet(wb, ws, name);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

function buildRevenuePeriodFilter(query = {}) {
  const periodType = String(query.periodType || "month").toLowerCase();
  const values = [];
  if (periodType === "day") {
    const day = String(query.day || "").trim();
    if (day) {
      values.push(day);
      return { sql: " AND DATE(o.created_at) = ? ", values, label: `Ngày ${day}` };
    }
    return { sql: " AND DATE(o.created_at) = CURRENT_DATE ", values, label: "Ngày hiện tại" };
  }
  if (periodType === "month") {
    const y = Number(query.year);
    const m = Number(query.month);
    if (Number.isInteger(y) && Number.isInteger(m) && m >= 1 && m <= 12) {
      values.push(y, m);
      return {
        sql: " AND EXTRACT(YEAR FROM o.created_at) = ? AND EXTRACT(MONTH FROM o.created_at) = ? ",
        values,
        label: `Tháng ${m}/${y}`,
      };
    }
    return {
      sql: " AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE) ",
      values,
      label: "Tháng hiện tại",
    };
  }
  if (periodType === "quarter") {
    const y = Number(query.year);
    const q = Number(query.quarter);
    if (Number.isInteger(y) && Number.isInteger(q) && q >= 1 && q <= 4) {
      values.push(y, q);
      return {
        sql: " AND EXTRACT(YEAR FROM o.created_at) = ? AND EXTRACT(QUARTER FROM o.created_at) = ? ",
        values,
        label: `Quý ${q}/${y}`,
      };
    }
    return {
      sql: " AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(QUARTER FROM o.created_at) = EXTRACT(QUARTER FROM CURRENT_DATE) ",
      values,
      label: "Quý hiện tại",
    };
  }
  if (periodType === "year") {
    const y = Number(query.year);
    if (Number.isInteger(y)) {
      values.push(y);
      return { sql: " AND EXTRACT(YEAR FROM o.created_at) = ? ", values, label: `Năm ${y}` };
    }
    return {
      sql: " AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE) ",
      values,
      label: "Năm hiện tại",
    };
  }
  if (periodType === "custom") {
    const from = String(query.from || "").trim();
    const to = String(query.to || "").trim();
    if (from && to) {
      values.push(from, to);
      return { sql: " AND DATE(o.created_at) BETWEEN ? AND ? ", values, label: `Từ ${from} đến ${to}` };
    }
  }
  return { sql: "", values, label: "Toàn bộ dữ liệu" };
}

async function buildTemplate(type) {
  if (type === "products_new") {
    const header = [
      [
        "SKU",
        "Tên SP",
        "Thương hiệu",
        "CPU",
        "RAM",
        "SSD",
        "Màn hình",
        "Giá nhập",
        "% Chi phí VH",
        "% Margin",
        "VAT rate",
        "Số lượng",
        "Nhà CC",
      ],
    ];
    return bookFromSheet("Mau", header);
  }
  if (type === "price_update") {
    return bookFromSheet("Mau", [["SKU", "Giá nhập mới", "Giá bán mới", "Ngày áp dụng"]]);
  }
  return bookFromSheet("Mau", [["Cột A", "Cột B"]]);
}

function normalizeProductsNewRow(row, line) {
  const errors = [];
  const sku = String(row?.SKU ?? row?.sku ?? "").trim();
  const name = String(row?.["Tên SP"] ?? row?.name ?? "").trim();
  const brand = String(row?.["Thương hiệu"] ?? row?.brand ?? "").trim();
  const imp = Number(row?.["Giá nhập"] ?? row?.importPrice ?? 0);
  const vhPct = Number(row?.["% Chi phí VH"] ?? row?.vhPct ?? 0);
  const marginPct = Number(row?.["% Margin"] ?? row?.marginPct ?? 0);
  const vat = Number(row?.["VAT rate"] ?? row?.vatRate ?? 10);
  const qty = Math.max(0, Number(row?.["Số lượng"] ?? row?.qty ?? 0));

  if (!sku) errors.push({ row: line, field: "SKU", message: "Thiếu SKU" });
  if (!name) errors.push({ row: line, field: "Tên SP", message: "Thiếu tên" });
  if (!brand) errors.push({ row: line, field: "Thương hiệu", message: "Thiếu thương hiệu" });
  if (imp <= 0) errors.push({ row: line, field: "Giá nhập", message: "Giá nhập phải > 0" });
  if (vhPct < 0 || vhPct > 100) errors.push({ row: line, field: "% Chi phí VH", message: "0–100%" });
  if (marginPct < 0 || marginPct > 100) errors.push({ row: line, field: "% Margin", message: "0–100%" });
  if (vat < 0 || vat > 100) errors.push({ row: line, field: "VAT rate", message: "0–100%" });

  const cpu = String(row?.CPU ?? row?.cpu ?? "").trim();
  const screen = String(row?.["Màn hình"] ?? row?.screen ?? "").trim();
  const version = [cpu, screen].filter(Boolean).join(" / ") || "";

  const operationalCost = Math.round(imp * (vhPct / 100) * 100) / 100;

  const payload = {
    name,
    brand,
    sku,
    status: "active",
    variants: [
      {
        sku,
        ram: String(row?.RAM ?? row?.ram ?? "").trim(),
        storage: String(row?.SSD ?? row?.ssd ?? "").trim(),
        version,
        stock: qty,
        importPrice: imp,
        logisticsCost: 0,
        operationalCost,
        targetMarginPercent: marginPct,
        vatRate: vat,
      },
    ],
  };

  return { errors, payload, preview: { line, sku, name, brand, importPrice: imp, qty } };
}

async function handleImport(type, rows, user, options = {}) {
  if (!Array.isArray(rows)) throw new AppError("rows phải là mảng", 400, "VALIDATION_ERROR");
  const dryRun = Boolean(options.dryRun);
  const ok = [];
  const errors = [];
  const preview = [];

  if (type === "products_new") {
    for (let i = 0; i < rows.length; i += 1) {
      const line = i + 2;
      const { errors: rowErr, payload, preview: pv } = normalizeProductsNewRow(rows[i], line);
      if (rowErr.length) {
        errors.push(...rowErr);
        continue;
      }
      if (dryRun) {
        preview.push(pv);
        ok.push(line);
        continue;
      }
      try {
        await adminProductsService.createAdminProduct(payload);
        ok.push(line);
      } catch (e) {
        errors.push({ row: line, field: "*", message: e.message || "Lỗi tạo SP" });
      }
    }
    return {
      dryRun,
      successCount: ok.length,
      errorCount: errors.length,
      errors,
      preview: dryRun ? preview : undefined,
    };
  }

  if (type === "price_update") {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const line = i + 2;
      const sku = row?.SKU || row?.sku;
      if (!sku) {
        errors.push({ row: line, field: "SKU", message: "Thiếu SKU" });
        continue;
      }
      const newRetail = Number(row?.["Giá bán mới"] ?? row.retailPrice);
      if (newRetail <= 0) {
        errors.push({ row: line, field: "Giá bán mới", message: "Giá bán mới phải > 0" });
        continue;
      }
      const [[v]] = await pool.query("SELECT id, product_id FROM product_variants WHERE sku = ? LIMIT 1", [String(sku).trim()]);
      if (!v) {
        errors.push({ row: line, field: "SKU", message: "SKU không tồn tại" });
        continue;
      }
      if (dryRun) {
        preview.push({ line, sku: String(sku).trim(), variantId: v.id });
        ok.push(line);
        continue;
      }
      try {
        const newImport = Number(row?.["Giá nhập mới"] ?? row.importPrice);
        await pool.query(
          `UPDATE product_variants SET import_price = COALESCE(?, import_price), retail_price = ?, price = ? WHERE id = ?`,
          [newImport || null, newRetail, newRetail, v.id]
        );
        ok.push(line);
      } catch (e) {
        errors.push({ row: line, field: "*", message: e.message });
      }
    }
    return { dryRun, successCount: ok.length, errorCount: errors.length, errors, preview: dryRun ? preview : undefined };
  }

  throw new AppError("Loại import không hỗ trợ", 400, "VALIDATION_ERROR");
}

async function buildReport(report, query, user) {
  void query;

  const headerMeta = [
    ["LAPSTORE — Báo cáo"],
    [`Loại: ${report}`, `Ngày xuất: ${new Date().toLocaleString("vi-VN")}`],
    [`Người xuất: ${user?.email || ""}`],
    [],
  ];

  if (report === "inventory" || report === "products" || report === "products_all") {
    const [rows] = await pool.query(
      `
      SELECT
        p.id AS productId,
        p.name AS productName,
        p.brand AS brand,
        COALESCE(pam.status, 'active') AS status,
        COALESCE(pam.sku, '') AS productSku,
        COALESCE(pam.slug, '') AS slug,
        COALESCE(pv.sku, 'VAR-' || pv.id) AS variantSku,
        COALESCE(pv.version, '') AS variantVersion,
        COALESCE(pv.color, '') AS color,
        COALESCE(pv.ram, '') AS ram,
        COALESCE(pv.storage, '') AS storage,
        COALESCE(ps.cpu, '') AS cpu,
        COALESCE(ps.gpu_onboard, '') AS gpuOnboard,
        COALESCE(ps.gpu_discrete, '') AS gpuDiscrete,
        COALESCE(ps.screen_size, '') AS screenSize,
        COALESCE(ps.screen_resolution, '') AS screenResolution,
        COALESCE(ps.os, '') AS os,
        COALESCE(pv.stock, 0) AS qty,
        COALESCE(pv.import_price, 0) AS importPrice,
        COALESCE(pv.cost_price, pv.import_price, 0) AS costPrice,
        COALESCE(pv.retail_price, pv.price, 0) AS retailPrice,
        COALESCE(pv.original_price, 0) AS originalPrice,
        COALESCE(pv.margin_percent, 0) AS marginPercent,
        COALESCE(pv.vat_rate, 0) AS vatRate,
        COALESCE(pv.is_active, 1) AS variantActive
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN product_admin_meta pam ON pam.product_id = p.id
      LEFT JOIN product_specs ps ON ps.product_id = p.id
      ORDER BY p.name, pv.id
      `
    );
    const data = [[
      "Product ID",
      "Tên sản phẩm",
      "Thương hiệu",
      "Trạng thái SP",
      "SKU sản phẩm",
      "Slug",
      "SKU phiên bản",
      "Phiên bản",
      "Màu sắc",
      "RAM",
      "Storage",
      "CPU",
      "GPU onboard",
      "GPU rời",
      "Màn hình",
      "Độ phân giải",
      "Hệ điều hành",
      "SL tồn",
      "Giá nhập",
      "Giá vốn",
      "Giá bán",
      "Giá gốc",
      "Biên lợi nhuận (%)",
      "VAT (%)",
      "Active variant",
      "Tổng giá trị tồn (giá vốn)",
      "Doanh thu tiềm năng (giá bán)",
    ]];
    let sumCost = 0;
    let sumPotentialRevenue = 0;
    rows.forEach((r) => {
      const qty = Number(r.qty || 0);
      const costValue = qty * Number(r.costPrice || 0);
      const potentialRevenue = qty * Number(r.retailPrice || 0);
      sumCost += costValue;
      sumPotentialRevenue += potentialRevenue;
      data.push([
        r.productId,
        r.productName,
        r.brand,
        r.status,
        r.productSku,
        r.slug,
        r.variantSku,
        r.variantVersion,
        r.color,
        r.ram,
        r.storage,
        r.cpu,
        r.gpuOnboard,
        r.gpuDiscrete,
        r.screenSize,
        r.screenResolution,
        r.os,
        qty,
        Number(r.importPrice || 0),
        Number(r.costPrice || 0),
        Number(r.retailPrice || 0),
        Number(r.originalPrice || 0),
        Number(r.marginPercent || 0),
        Number(r.vatRate || 0),
        Number(r.variantActive || 0) === 1 ? "Yes" : "No",
        costValue,
        potentialRevenue,
      ]);
    });
    data.push([]);
    data.push(["Tổng cộng", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", sumCost, sumPotentialRevenue]);
    const wb = XLSX.utils.book_new();
    const ws = sheetFromAoA([...headerMeta, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, "TatCaSanPham");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  if (report === "revenue") {
    const period = buildRevenuePeriodFilter(query || {});
    const [rows] = await pool.query(
      `
      SELECT DATE(o.created_at) AS d, o.order_code AS code, oi.product_name AS pname,
        COALESCE(oi.unit_cost_snapshot, 0) AS cost, oi.unit_price AS price, oi.quantity AS qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('accepted','delivered')
      ${period.sql}
      ORDER BY o.created_at DESC
      LIMIT 5000
      `
      ,
      period.values
    );
    const [summaryRows] = await pool.query(
      `
      SELECT
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(oi.unit_price * oi.quantity), 0) AS gross_revenue,
        COALESCE(SUM(COALESCE(oi.unit_cost_snapshot, 0) * oi.quantity), 0) AS total_cost
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('accepted','delivered')
      ${period.sql}
      `,
      period.values
    );
    const s = summaryRows?.[0] || {};
    const gross = Number(s.gross_revenue || 0);
    const cost = Number(s.total_cost || 0);
    const profit = gross - cost;
    const data = [["Ngày", "Mã đơn", "SP", "Giá vốn", "Giá bán", "SL", "Doanh thu", "Lợi nhuận"]];
    rows.forEach((r) => {
      const rev = Number(r.price) * Number(r.qty);
      const cost = Number(r.cost) * Number(r.qty);
      data.push([r.d, r.code, r.pname, r.cost, r.price, r.qty, rev, rev - cost]);
    });
    const wb = XLSX.utils.book_new();
    const summary = [
      ["Kỳ báo cáo", period.label],
      ["Số đơn", Number(s.order_count || 0)],
      ["Doanh thu gộp", gross],
      ["Tổng giá vốn", cost],
      ["Lợi nhuận ước tính", profit],
      [],
    ];
    XLSX.utils.book_append_sheet(wb, sheetFromAoA([...headerMeta, ...summary, ...data]), "DoanhThu");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromAoA([...headerMeta, ["Chưa có dữ liệu"]]), "Sheet1");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

module.exports = {
  buildTemplate,
  handleImport,
  buildReport,
};
