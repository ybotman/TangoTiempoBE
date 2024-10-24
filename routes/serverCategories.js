// routes/serverCategories.js
const express = require("express");
const router = express.Router();
const Categories = require("../models/categories");

// GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Categories.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// PUT update category
router.put("/:id", async (req, res) => {
  try {
    const updatedCategory = await Categories.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Error updating category" });
  }
});

module.exports = router;
