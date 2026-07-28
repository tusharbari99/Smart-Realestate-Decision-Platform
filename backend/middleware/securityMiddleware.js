const helmet = require("helmet");

const {
  rateLimit,
} = require("express-rate-limit");

const helmetMiddleware = helmet({
  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },

  contentSecurityPolicy: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message:
      "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,

  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {
    message:
      "Too many login attempts. Please wait and try again.",
  },
});

const adminActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message:
      "Too many admin requests. Please wait briefly.",
  },
});

module.exports = {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  adminActionLimiter,
};
