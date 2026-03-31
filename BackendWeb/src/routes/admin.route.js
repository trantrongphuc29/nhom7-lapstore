const express = require("express");
const { verifyToken, requireStaff } = require("../middlewares/auth");
const { buildAdminProductsRouter } = require("./admin/products.route");
const { buildAdminTaxonomyRouter } = require("./admin/taxonomy.route");
const { buildAdminOrdersRouter } = require("./admin/orders.route");
const { buildAdminCustomersRouter } = require("./admin/customers.route");
const { buildAdminSettingsRouter } = require("./admin/settings.route");
const { buildAdminReportsRouter } = require("./admin/reports.route");
const { buildAdminPromotionsRouter } = require("./admin/promotions.route");
const { buildAdminMiscRouter } = require("./admin/misc.route");

const router = express.Router();

const staff = [verifyToken, requireStaff()];

router.use(buildAdminProductsRouter(staff));
router.use(buildAdminTaxonomyRouter(staff));
router.use(buildAdminOrdersRouter(staff));
router.use(buildAdminCustomersRouter(staff));
router.use(buildAdminSettingsRouter(staff));
router.use(buildAdminReportsRouter(staff));
router.use(buildAdminPromotionsRouter(staff));
router.use(buildAdminMiscRouter(staff));

module.exports = router;
