// routes/serverCategories.js
const express = require("express");
const router = express.Router();
const Categories = require("../models/categories");
const rateLimiter = require("../middleware/rateLimiter");
const logger = require("../utils/logger");
// Apply rate limiter to all routes in this router
router.use(rateLimiter);

// GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Categories.find();
    res.status(200).json(categories);
  } catch (error) {
    logger.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

module.exports = router;
