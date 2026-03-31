import { BACKEND_BASE_URL } from "../../../config/api";

function shortenCpuLabel(cpu) {
  if (!cpu) return null;
  let s = cpu
    .replace(/^Intel\s+Core\s+/i, "")
    .replace(/^Intel\s+/i, "")
    .replace(/^AMD\s+Ryzen\s+/i, "Ryzen ")
    .replace(/^Apple\s+/i, "")
    .trim();
  s = s.replace(/^(i\d+)-/i, "$1 ");
  return s;
}

function screenPart(resolution, technology) {
  const t = technology?.trim();
  const r = resolution?.trim();
  if (t && t.length <= 28) return t;
  if (r) return r;
  return t || null;
}

function buildSpecSummary(product) {
  return [
    shortenCpuLabel(product.cpu),
    product.ram,
    product.storage,
    screenPart(product.screen_resolution, product.screen_technology),
  ]
    .filter(Boolean)
    .join(", ");
}

const fmt = (price) => new Intl.NumberFormat("vi-VN").format(price);

export function mapProductToCard(product) {
  const displaySku =
    product.display_sku || product.displaySku || product.master_sku || product.masterSku || product.first_variant_sku || "";
  return {
    ...product,
    status: product.status ?? null,
    displaySku,
    imageUrl: product.image
      ? product.image.startsWith("http")
        ? product.image
        : `${BACKEND_BASE_URL}/${product.image}`
      : null,
    priceFormatted: product.min_price ? fmt(product.min_price) : "Liên hệ",
    specSummary: buildSpecSummary(product),
    min_discount: Number(product.min_discount) || 0,
    colors: (product.colors || "").split("|").filter(Boolean),
    variantCount: Number(product.variant_count) || 0,
  };
}
