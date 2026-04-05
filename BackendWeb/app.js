const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./src/middlewares/errorHandler");
const AppError = require("./src/utils/AppError");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("combined"));
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://nhom7-lapstore.onrender.com",
      ];
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth rate limiting:
// - /auth/me can be polled by frontend; keep it lenient.
// - /auth/login and /auth/register should be protected more strictly.
const authMeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth requests, please try again later", code: "RATE_LIMITED" },
});

const authWriteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth requests, please try again later", code: "RATE_LIMITED" },
});

app.use("/images", express.static("images"));

app.use("/api/store-config", require("./src/routes/storeConfig.route"));
app.use("/api/banners", require("./src/routes/banners.route"));
app.use("/api/products", require("./src/routes/products.route"));
app.use("/api/vouchers", require("./src/routes/vouchers.route"));
app.use("/api/orders", require("./src/routes/storefrontOrders.route"));
app.use("/api/auth/me", authMeRateLimit);
app.use("/api/auth/login", authWriteRateLimit);
app.use("/api/auth/register", authWriteRateLimit);
app.use("/api/auth", require("./src/routes/auth.route"));
app.use("/api/account", require("./src/routes/account.route"));
app.use("/api/users", require("./src/routes/users.route"));
app.use("/api/admin", require("./src/routes/admin.route"));

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.use("*", (req, res, next) => {
  next(new AppError("Route not found", 404, "NOT_FOUND"));
});

app.use(errorHandler);

module.exports = app;
