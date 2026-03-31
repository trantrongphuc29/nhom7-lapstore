const pool = require("../../config/database");

const DEFAULT_PRICING = {
  default_vat_rate: 10,
  default_rounding_rule: "round_nearest_1000",
  psychological_suffix: 990,
};

async function getPricingSettings() {
  try {
    const [[row]] = await pool.query("SELECT value FROM app_settings WHERE key = 'pricing' LIMIT 1");
    const d = row?.value;
    const v = typeof d === "string" ? JSON.parse(d) : d || {};
    return { ...DEFAULT_PRICING, ...v };
  } catch {
    return { ...DEFAULT_PRICING };
  }
}

async function updatePricingSettings(patch) {
  const cur = await getPricingSettings();
  const next = { ...cur, ...patch };
  await pool.query(
    "INSERT INTO app_settings (key, value) VALUES ('pricing', CAST(? AS JSONB)) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(next)]
  );
  return next;
}

module.exports = { getPricingSettings, updatePricingSettings, DEFAULT_PRICING };
