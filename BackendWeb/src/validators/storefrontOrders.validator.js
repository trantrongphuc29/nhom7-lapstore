function validateCreateStorefrontOrder(req) {
  const b = req.body || {};
  if (!Array.isArray(b.items) || b.items.length === 0) return "Danh sách sản phẩm (items) là bắt buộc";
  if (!b.shipping || typeof b.shipping !== "object") return "Thông tin shipping là bắt buộc";
  if (!b.shipping.fulfillment) return "Thiếu fulfillment (pickup | delivery)";
  return null;
}

module.exports = { validateCreateStorefrontOrder };
