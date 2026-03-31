const adminExcelService = require("../../services/adminExcel.service");
const adminAuditService = require("../../services/adminAudit.service");
const { sendSuccess } = require("../../utils/response");

function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function buildReportFileName(report, query = {}) {
  const r = String(report || "report").toLowerCase();
  if (r === "revenue") {
    const p = String(query.periodType || "month").toLowerCase();
    if (p === "day") return `bao-cao-doanh-thu-ngay-${query.day || ymd()}.xlsx`;
    if (p === "month") return `bao-cao-doanh-thu-thang-${query.month || "00"}-${query.year || "xxxx"}.xlsx`;
    if (p === "quarter") return `bao-cao-doanh-thu-quy-${query.quarter || "x"}-${query.year || "xxxx"}.xlsx`;
    if (p === "year") return `bao-cao-doanh-thu-nam-${query.year || "xxxx"}.xlsx`;
    if (p === "custom") return `bao-cao-doanh-thu-tu-${query.from || "from"}-den-${query.to || "to"}.xlsx`;
    return `bao-cao-doanh-thu-${ymd()}.xlsx`;
  }
  if (r === "inventory" || r === "products" || r === "products_all") return `bao-cao-tat-ca-san-pham-${ymd()}.xlsx`;
  if (r === "imports") return `bao-cao-nhap-hang-${ymd()}.xlsx`;
  return `bao-cao-${r}-${ymd()}.xlsx`;
}

async function postExcelImport(req, res) {
  const result = await adminExcelService.handleImport(req.body?.type, req.body?.rows, req.user, {
    dryRun: Boolean(req.body?.dryRun),
  });
  await adminAuditService.createAuditLog({
    userId: req.user?.sub || null,
    module: "excel",
    action: "import",
    targetType: "excel_import",
    targetId: req.body?.type || "unknown",
    metadata: { dryRun: Boolean(req.body?.dryRun), rowCount: Array.isArray(req.body?.rows) ? req.body.rows.length : 0 },
  });
  sendSuccess(res, result);
}

async function getExcelTemplate(req, res) {
  const buf = await adminExcelService.buildTemplate(req.query.type || "products_new");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="mau-${req.query.type || "products"}.xlsx"`);
  res.send(buf);
}

async function getReportExport(req, res) {
  const buf = await adminExcelService.buildReport(req.query.report, req.query, req.user);
  await adminAuditService.createAuditLog({
    userId: req.user?.sub || null,
    module: "reports",
    action: "export",
    targetType: "report",
    targetId: req.query.report || "export",
    metadata: { filters: req.query || {} },
  });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${buildReportFileName(req.query.report, req.query)}"`);
  res.send(buf);
}

module.exports = { postExcelImport, getExcelTemplate, getReportExport };
