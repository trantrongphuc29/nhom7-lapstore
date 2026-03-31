function validateRegister(req) {
  const { email, password, confirmPassword } = req.body || {};
  if (!email || !password || !confirmPassword) {
    return "Email, password, confirmPassword are required";
  }
  return null;
}

function validateLogin(req) {
  const { email, password } = req.body || {};
  if (!email || !password) return "Email and password are required";
  return null;
}

module.exports = { validateRegister, validateLogin };
