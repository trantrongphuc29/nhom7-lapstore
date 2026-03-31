const express = require("express");
const controller = require("../../controllers/admin/misc.controller");
const asyncHandler = require("../../middlewares/asyncHandler");
const { upload } = require("../../middlewares/upload");

function buildAdminMiscRouter(staffMiddlewares) {
  const router = express.Router();
  router.get("/dashboard", ...staffMiddlewares, asyncHandler(controller.getDashboardOverview));
  router.get("/audit-logs", ...staffMiddlewares, asyncHandler(controller.getAuditLogs));
  router.post(
    "/uploads/images",
    ...staffMiddlewares,
    upload.array("images", 10),
    asyncHandler(controller.uploadImages)
  );
  return router;
}

module.exports = { buildAdminMiscRouter };
