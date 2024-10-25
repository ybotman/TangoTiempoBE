const express = require("express");
const router = express.Router();
const Permissions = require("../models/permissions");

// GET /api/permissions - Fetch all permissions
router.get("/", async (req, res) => {
  try {
    const permissions = await Permissions.find();
    res.status(200).json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: "Error fetching permissions" });
  }
});

module.exports = router;