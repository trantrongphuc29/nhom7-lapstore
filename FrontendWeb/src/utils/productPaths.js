/** Đường dẫn chi tiết sản phẩm trên storefront: ưu tiên slug, fallback id */
export function storefrontProductPath(productOrKey) {
  if (productOrKey == null) return "/products";
  if (typeof productOrKey === "object") {
    const slug = productOrKey.slug;
    const id = productOrKey.id;
    const key = (slug != null && String(slug).trim() !== "" ? slug : id) ?? "";
    if (key === "") return "/products";
    return `/products/${encodeURIComponent(String(key))}`;
  }
  return `/products/${encodeURIComponent(String(productOrKey))}`;
}
