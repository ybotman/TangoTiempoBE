const express = require("express");
const router = express.Router();
const Roles = require("../models/roles");
const rateLimiter = require("../middleware/rateLimiter");
const logger = require("../utils/logger");
// Apply rate limiter to all routes in this router
router.use(rateLimiter);

// GET /api/roles - Fetch all roles
router.get("/", async (req, res) => {
  try {
    const roles = await Roles.find();
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Error fetching roles" });
  }
});

module.exports = router;
