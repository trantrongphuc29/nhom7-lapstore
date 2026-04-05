const pool = require("../../config/database");

const DEFAULT_PRICING = {
  default_vat_rate: 10,
  default_rounding_rule: "round_nearest_1000",
  psychological_suffix: 990,
};

const DEFAULT_STOREFRONT = {
  default_shipping_fee: 50_000,
  free_shipping_threshold: 10_000_000,
  default_fulfillment: "pickup",
  footer_hotline: "1900 630 680",
  footer_email: "lapstore@gmail.com",
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

async function getStorefrontSettings() {
  try {
    const [[row]] = await pool.query("SELECT value FROM app_settings WHERE key = 'storefront' LIMIT 1");
    const d = row?.value;
    const v = typeof d === "string" ? JSON.parse(d) : d || {};
    return { ...DEFAULT_STOREFRONT, ...v };
  } catch {
    return { ...DEFAULT_STOREFRONT };
  }
}

function clampMoney(n, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return fallback;
  return Math.round(x);
}

function normalizeFulfillment(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (s === "delivery" || s === "ship" || s === "shipping") return "delivery";
  return "pickup";
}

async function updateStorefrontSettings(patch = {}) {
  const cur = await getStorefrontSettings();
  const next = { ...cur };
  if (patch.default_shipping_fee != null) {
    next.default_shipping_fee = clampMoney(patch.default_shipping_fee, cur.default_shipping_fee);
  }
  if (patch.free_shipping_threshold != null) {
    next.free_shipping_threshold = clampMoney(patch.free_shipping_threshold, cur.free_shipping_threshold);
  }
  if (patch.default_fulfillment != null) {
    next.default_fulfillment = normalizeFulfillment(patch.default_fulfillment);
  }
  if (patch.footer_hotline != null) {
    next.footer_hotline = String(patch.footer_hotline || "").trim() || cur.footer_hotline;
  }
  if (patch.footer_email != null) {
    next.footer_email = String(patch.footer_email || "").trim() || cur.footer_email;
  }
  await pool.query(
    "INSERT INTO app_settings (key, value) VALUES ('storefront', CAST(? AS JSONB)) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [JSON.stringify(next)]
  );
  return next;
}

function toPublicStoreConfig(row) {
  return {
    defaultShippingFee: Number(row.default_shipping_fee) || DEFAULT_STOREFRONT.default_shipping_fee,
    freeShippingThreshold: Number(row.free_shipping_threshold) || DEFAULT_STOREFRONT.free_shipping_threshold,
    defaultFulfillment: normalizeFulfillment(row.default_fulfillment),
    footerHotline: String(row.footer_hotline || DEFAULT_STOREFRONT.footer_hotline),
    footerEmail: String(row.footer_email || DEFAULT_STOREFRONT.footer_email),
  };
}

module.exports = {
  getPricingSettings,
  updatePricingSettings,
  DEFAULT_PRICING,
  getStorefrontSettings,
  updateStorefrontSettings,
  DEFAULT_STOREFRONT,
  toPublicStoreConfig,
};
