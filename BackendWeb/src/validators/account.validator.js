function validatePatchProfile(req) {
  const { fullName, phone } = req.body || {};
  if (fullName !== undefined && typeof fullName !== "string") return "fullName must be a string";
  if (phone !== undefined && typeof phone !== "string") return "phone must be a string";
  if (phone !== undefined && phone.length > 40) return "phone is too long";
  return null;
}

function validateChangePassword(req) {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  if (!currentPassword || !newPassword || !confirmPassword) {
    return "currentPassword, newPassword, confirmPassword are required";
  }
  return null;
}

function validateAddressBody(req, isCreate) {
  const b = req.body || {};
  if (isCreate) {
    if (!b.recipientName || typeof b.recipientName !== "string") return "recipientName is required";
    if (!b.phone || typeof b.phone !== "string") return "phone is required";
    if (!b.line1 || typeof b.line1 !== "string") return "line1 is required";
  }
  if (b.recipientName !== undefined && typeof b.recipientName !== "string") return "recipientName must be a string";
  if (b.phone !== undefined && typeof b.phone !== "string") return "phone must be a string";
  if (b.line1 !== undefined && typeof b.line1 !== "string") return "line1 must be a string";
  if (b.line2 !== undefined && b.line2 !== null && typeof b.line2 !== "string") return "line2 must be a string";
  if (b.ward !== undefined && b.ward !== null && typeof b.ward !== "string") return "ward must be a string";
  if (b.district !== undefined && b.district !== null && typeof b.district !== "string") return "district must be a string";
  if (b.province !== undefined && b.province !== null && typeof b.province !== "string") return "province must be a string";
  if (b.isDefault !== undefined && typeof b.isDefault !== "boolean") return "isDefault must be boolean";
  return null;
}

function validateCreateAddress(req) {
  return validateAddressBody(req, true);
}

function validateUpdateAddress(req) {
  return validateAddressBody(req, false);
}

function validatePutCart(req) {
  const items = req.body?.items;
  if (!Array.isArray(items)) return "items array is required";
  return null;
}

module.exports = {
  validatePatchProfile,
  validateChangePassword,
  validateCreateAddress,
  validateUpdateAddress,
  validatePutCart,
};
