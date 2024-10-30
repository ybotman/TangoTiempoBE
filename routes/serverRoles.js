const express = require("express");
const router = express.Router();
const Roles = require("../models/roles");
const Permissions = require("../models/permissions");

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

// POST /api/roles - Insert a new role
router.post("/", async (req, res) => {
  try {
    // Check whether the res.body.permissions exists in the permissions collection
    const permissions = req.body.permissions;
    const validPermissions = await Permissions.find({ permissionName: { $in: permissions } });
    if (permissions.length !== validPermissions.length) {
      res.status(400).json({ message: "Invalid permissions" });
      return;
    }

    const role = new Roles(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    console.error("Error inserting role:", error);
    res.status(500).json({ message: "Error inserting role" });
  }
});

// PUT /api/roles/:id - Update a role
router.put("/:id", async (req, res) => {
  try {
    // Check whether the res.body.permissions exists in the permissions collection
    const permissions = req.body.permissions;
    const validPermissions = await Permissions.find({ permissionName: { $in: permissions } });
    if (permissions.length !== validPermissions.length) {
      res.status(400).json({ message: "Invalid permissions" });
      return;
    }

    const role = await Roles.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (role) {
      res.status(200).json(role);
    } else {
      res.status(404).json({ message: "Role not found" });
    }
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Error updating role" });
  }
});

// DELETE /api/roles/:id - Delete a role
router.delete("/:id", async (req, res) => {
  try {
    const role = await Roles.findByIdAndDelete(req.params.id);
    if (role) {
      res.status(200).json(role);
    } else {
      res.status(404).json({ message: "Role not found" });
    }
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: "Error deleting role" });
  }
});

module.exports = router;
