function validateIdParam(req) {
  const id = Number(req.params?.id);
  if (!Number.isInteger(id) || id <= 0) return "Invalid id parameter";
  return null;
}

module.exports = { validateIdParam };
