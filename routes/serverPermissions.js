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

// POST /api/permissions - Insert a new permission
router.post("/", async (req, res) => {
  const { permissionName, description } = req.body;

  if (!permissionName || !description) {
    return res.status(400).json({
      message: "Permission name and description are required",
    });
  }

  try {
    const permission = new Permissions({ permissionName, description });
    await permission.save();
    res.status(201).json(permission);
  } catch (error) {
    console.error("Error inserting permission:", error);
    res.status(500).json({ message: "Error inserting permission" });
  }
});

// PUT /api/permissions/:id - Update a permission
router.put("/:id", async (req, res) => {
  const { permissionName, description } = req.body;

  if (!permissionName || !description) {
    return res.status(400).json({
      message: "Permission name and description are required",
    });
  }

  try {
    const permission = await Permissions.findByIdAndUpdate(
      req.params.id,
      { permissionName, description },
      { new: true }
    );

    if (!permission) {
      return res.status(404).json({ message: "Permission not found" });
    }

    res.status(200).json(permission);
  } catch (error) {
    console.error("Error updating permission:", error);
    res.status(500).json({ message: "Error updating permission" });
  }
});

// DELETE /api/permissions/:id - Delete a permission
router.delete("/:id", async (req, res) => {
  try {
    const deletedPermission = await Permissions.findByIdAndDelete(req.params.id);

    if (!deletedPermission) {
      return res.status(404).json({ message: "Permission not found" });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting permission:", error);
    res.status(500).json({ message: "Error deleting permission" });
  }
});

module.exports = router;