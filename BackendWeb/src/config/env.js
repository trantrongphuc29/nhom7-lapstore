function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("JWT_SECRET is required in production");
  }
  return secret || "dev_jwt_secret_change_me";
}

module.exports = { getJwtSecret };
