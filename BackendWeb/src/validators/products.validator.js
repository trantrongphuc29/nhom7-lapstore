/** GET /products/:id — id số hoặc slug (khớp slug trong product_admin_meta) */
function validateProductParam(req) {
  const raw = req.params?.id;
  if (raw == null || String(raw).trim() === "") return "Invalid product parameter";
  const s = decodeURIComponent(String(raw).trim());
  if (/^\d+$/.test(s)) return null;
  if (s.length > 191) return "Invalid product slug";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(s)) return "Invalid product slug";
  return null;
}

function validateProductQuery(req) {
  const { minPrice, maxPrice } = req.query || {};
  if (minPrice != null && minPrice !== "" && Number.isNaN(Number(minPrice))) {
    return "minPrice must be a number";
  }
  if (maxPrice != null && maxPrice !== "" && Number.isNaN(Number(maxPrice))) {
    return "maxPrice must be a number";
  }
  if (
    minPrice != null &&
    minPrice !== "" &&
    maxPrice != null &&
    maxPrice !== "" &&
    Number(minPrice) > Number(maxPrice)
  ) {
    return "minPrice must be less than or equal to maxPrice";
  }
  return null;
}

module.exports = { validateProductQuery, validateProductParam };
