function validateCreateUser(req) {
  const { name, email } = req.body || {};
  if (!name || !email) return "Name and email are required";
  return null;
}

module.exports = { validateCreateUser };
