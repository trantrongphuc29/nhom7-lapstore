function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction && !secret) {
    console.warn("⚠️  WARNING: JWT_SECRET is not set in production! Using default temporary secret.");
  }
  
  if (!secret) {
    console.warn("⚠️  Using development default JWT_SECRET. Set JWT_SECRET environment variable for production!");
  }
  
  return secret || "dev_jwt_secret_change_me";
}

module.exports = { getJwtSecret };
