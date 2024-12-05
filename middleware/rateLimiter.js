// middlewares/rateLimiter.js

const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// Centralized rate limiter configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes.",
  handler: (req, res) => {
    // Log the exceeding limit
    logger.warn(
      `Rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`,
    );
    res.status(429).json({
      message:
        "Too many requests from this IP, please try again after 15 minutes.",
    });
  },
});

module.exports = rateLimiter;
