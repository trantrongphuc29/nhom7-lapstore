const adminSettingsService = require("../services/adminSettings.service");
const { sendSuccess } = require("../utils/response");

async function getPublicStoreConfig(req, res) {
  const row = await adminSettingsService.getStorefrontSettings();
  const data = adminSettingsService.toPublicStoreConfig(row);
  sendSuccess(res, data);
}

module.exports = { getPublicStoreConfig };
