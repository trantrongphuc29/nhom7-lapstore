const express = require("express");
const controller = require("../../controllers/admin/reports.controller");
const asyncHandler = require("../../middlewares/asyncHandler");
const validate = require("../../middlewares/validate");
const { validateReportExport, validateExcelImport } = require("../../validators/admin.validator");

function buildAdminReportsRouter(staffMiddlewares) {
  const router = express.Router();
  router.post("/excel/import", ...staffMiddlewares, validate(validateExcelImport), asyncHandler(controller.postExcelImport));
  router.get("/excel/template", ...staffMiddlewares, asyncHandler(controller.getExcelTemplate));
  router.get("/reports/export", ...staffMiddlewares, validate(validateReportExport), asyncHandler(controller.getReportExport));
  return router;
}

module.exports = { buildAdminReportsRouter };
