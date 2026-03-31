const adminDashboardService = require("../../services/adminDashboard.service");
const adminAuditService = require("../../services/adminAudit.service");
const { sendSuccess } = require("../../utils/response");
const { processUploadedImages } = require("../../middlewares/upload");

async function getDashboardOverview(req, res) {
  const overview = await adminDashboardService.getAdminDashboardOverview();
  sendSuccess(res, overview);
}

async function getAuditLogs(req, res) {
  const result = await adminAuditService.getAuditLogs(req.query);
  sendSuccess(res, result);
}

async function uploadImages(req, res) {
  const paths = await processUploadedImages(req.files || [], req.body?.productName || "");
  res.json({ success: true, data: { records: paths } });
}

module.exports = { getDashboardOverview, getAuditLogs, uploadImages };
