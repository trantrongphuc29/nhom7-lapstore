/**
 * VAT: giá bán lẻ đã gồm VAT; tách phần VAT nội bộ (inclusive).
 * vat_amount = retail * vat_rate / (100 + vat_rate)
 */

function num(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function vatAmountFromInclusiveRetail(retail, vatRatePercent) {
  const r = num(retail);
  const v = num(vatRatePercent);
  if (v <= 0 || r <= 0) return 0;
  return (r * v) / (100 + v);
}

function profitAndMargin(retail, costPrice, vatRatePercent) {
  const r = num(retail);
  const c = num(costPrice);
  const vat = vatAmountFromInclusiveRetail(r, vatRatePercent);
  const profit = r - c - vat;
  const marginPct = c > 0 ? (profit / c) * 100 : null;
  return {
    vat_amount: Math.round(vat * 100) / 100,
    profit_amount: Math.round(profit * 100) / 100,
    margin_percent: marginPct == null ? null : Math.round(marginPct * 10000) / 10000,
  };
}

/** retail tối thiểu để không lỗ (profit >= 0), chưa làm tròn tâm lý */
function minRetailNoLoss(costPrice, vatRatePercent) {
  const c = num(costPrice);
  const v = num(vatRatePercent);
  if (c <= 0) return 0;
  if (v <= 0) return c;
  return (c * (100 + v)) / 100;
}

/**
 * Từ cost và target margin trên cost: profit_target = cost * m/100
 * retail * 100/(100+v) - cost = cost * m/100
 * retail = cost * (1 + m/100) * (100+v)/100
 */
function retailRawFromTargetMargin(costPrice, targetMarginPercent, vatRatePercent) {
  const c = num(costPrice);
  const m = num(targetMarginPercent);
  const v = num(vatRatePercent);
  if (c <= 0) return 0;
  return c * (1 + m / 100) * ((100 + v) / 100);
}

/** Ví dụ 990.000 / 900.000 trong giá VND: phần dư 990.000 hoặc 900.000 sau mỗi triệu */
const MILLION_SUFFIX_990 = 990_000;
const MILLION_SUFFIX_900 = 900_000;

/** 990 → 990.000; 900.000 giữ nguyên */
function toMillionRemainder(suffix) {
  const s = num(suffix, 990);
  if (s >= 100_000) return s % 1_000_000;
  return (s % 1000) * 1000;
}

/** Giá tâm lý gần nhất: …990.000 / …900.000 (≥1 triệu) hoặc …990 / …900 (dưới 1 triệu) */
function nearestPsychologicalPrice(x, millionRemainder) {
  const r = Math.max(0, Math.round(x));
  const rem = millionRemainder % 1_000_000;

  if (r >= 1_000_000) {
    const k = Math.floor(r / 1_000_000);
    const candidates = [];
    for (let dk = -1; dk <= 1; dk++) {
      const kk = k + dk;
      if (kk < 0) continue;
      candidates.push(kk * 1_000_000 + rem);
    }
    return candidates.reduce((best, cur) => (Math.abs(cur - r) < Math.abs(best - r) ? cur : best));
  }

  let suf = 0;
  if (rem === MILLION_SUFFIX_990) suf = 990;
  else if (rem === MILLION_SUFFIX_900) suf = 900;
  else suf = rem % 1000;

  const base = Math.floor(r / 1000) * 1000;
  const candidates = [base - 1000 + suf, base + suf, base + 1000 + suf].filter((p) => p >= 0);
  if (candidates.length === 0) return suf;
  return candidates.reduce((best, cur) => (Math.abs(cur - r) < Math.abs(best - r) ? cur : best));
}

function roundTo990(n) {
  return nearestPsychologicalPrice(n, MILLION_SUFFIX_990);
}

function roundTo900(n) {
  return nearestPsychologicalPrice(n, MILLION_SUFFIX_900);
}

function applyRoundingRule(rawRetail, rule, suffix990 = 990) {
  const x = Math.max(0, num(rawRetail));
  switch (rule) {
    case "round_to_990":
      return roundTo990(x);
    case "round_to_900":
      return roundTo900(x);
    case "round_nearest_1000":
      return Math.round(x / 1000) * 1000;
    case "round_up":
      return Math.ceil(x / 1000) * 1000;
    case "round_down":
      return Math.floor(x / 1000) * 1000;
    case "round_psychological": {
      const rem = toMillionRemainder(suffix990);
      return nearestPsychologicalPrice(x, rem);
    }
    default:
      return Math.round(x);
  }
}

/**
 * Tính cost từ import + logistics + ops (số tuyệt đối)
 */
function computeCostPrice(importPrice, logisticsCost, operationalCost) {
  return num(importPrice) + num(logisticsCost) + num(operationalCost);
}

/**
 * Luồng đầy đủ: nhập cost parts + VAT + target margin + rounding
 */
function computeVariantPricing(input = {}, globalDefaults = {}) {
  const vatRaw = input.vat_rate ?? input.vatRate;
  const vatRate =
    vatRaw !== undefined && vatRaw !== null && vatRaw !== "" ? num(vatRaw) : num(globalDefaults.default_vat_rate, 10);
  const roundingRule = input.rounding_rule ?? input.roundingRule ?? globalDefaults.default_rounding_rule ?? "round_nearest_1000";
  const suffix = num(globalDefaults.psychological_suffix, 990);

  const importPrice = num(input.import_price ?? input.importPrice);
  const logistics = num(input.logistics_cost ?? input.logisticsCost);
  const ops = num(input.operational_cost ?? input.operationalCost);
  let costPrice = num(input.cost_price ?? input.costPrice);
  if (costPrice <= 0 && (importPrice > 0 || logistics > 0 || ops > 0)) {
    costPrice = computeCostPrice(importPrice, logistics, ops);
  }

  const allowLoss = Boolean(input.allow_loss_override ?? input.allowLossOverride);
  const targetMargin = input.target_margin_percent != null ? num(input.target_margin_percent) : num(input.targetMarginPercent);

  let retailRaw;
  if (input.retail_price != null && input.retail_price !== "" && num(input.retail_price) > 0) {
    retailRaw = num(input.retail_price);
  } else if (targetMargin > 0 && costPrice > 0) {
    retailRaw = retailRawFromTargetMargin(costPrice, targetMargin, vatRate);
  } else {
    retailRaw = num(input.retail_price ?? input.price_before_tax ?? input.price ?? 0);
  }

  let retailRounded = applyRoundingRule(retailRaw, roundingRule, suffix);
  const floor = minRetailNoLoss(costPrice, vatRate);
  if (!allowLoss && retailRounded < floor) {
    retailRounded = applyRoundingRule(floor, roundingRule, suffix);
    if (!allowLoss && retailRounded < floor) retailRounded = Math.ceil(floor);
  }

  const pb = num(input.price_before_tax ?? input.priceBeforeTax) || retailRounded;
  const retailFinal = retailRounded;

  const { vat_amount, profit_amount, margin_percent } = profitAndMargin(retailFinal, costPrice, vatRate);

  return {
    import_price: importPrice || null,
    logistics_cost: logistics,
    operational_cost: ops,
    cost_price: costPrice || null,
    price_before_tax: pb,
    vat_rate: vatRate,
    vat_amount,
    retail_price: retailFinal,
    wholesale_price: input.wholesale_price != null ? num(input.wholesale_price) : null,
    margin_percent,
    profit_amount,
    target_margin_percent: targetMargin || null,
    rounding_rule: roundingRule,
    allow_loss_override: allowLoss ? 1 : 0,
    /** Giá hiển thị / thanh toán = giá bán lẻ (đã gồm VAT nội bộ) */
    display_price: retailFinal,
    /** Cột price legacy storefront */
    price: retailFinal,
  };
}

function marginBadgeClass(marginPercent) {
  const m = num(marginPercent);
  if (m < 5) return "danger";
  if (m <= 15) return "warning";
  return "success";
}

module.exports = {
  num,
  vatAmountFromInclusiveRetail,
  profitAndMargin,
  minRetailNoLoss,
  retailRawFromTargetMargin,
  applyRoundingRule,
  computeCostPrice,
  computeVariantPricing,
  marginBadgeClass,
};
