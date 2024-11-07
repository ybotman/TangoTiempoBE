require("dotenv").config(); // Ensure dotenv is loaded

const express = require("express");
const router = express.Router();
const Organizers = require("../models/organizers");

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  ContainerSASPermissions,
  SASProtocol,
} = require("@azure/storage-blob");

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey,
);


// POST: Generate a SAS token
router.post("/generate-sas-token", async (req, res) => {
  try {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );
    const containerName = "organizer-images";
    const expiresOn = new Date(new Date().valueOf() + 3600 * 1000); // Token valid for 1 hour
    const permissions = ContainerSASPermissions.parse("rwl"); // Read, Write, List permissions

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        permissions,
        startsOn: new Date(),
        expiresOn,
        protocol: SASProtocol.Https,
      },
      sharedKeyCredential,
    ).toString();

    res.status(200).json({ sasToken });
  } catch (error) {
    console.error("Error generating SAS token:", error);
    res.status(500).json({ message: "Error generating SAS token" });
  }
});

// POST: Create a new organizer
router.post("/", async (req, res) => {
  try {
    const organizer = new Organizers(req.body);
    const savedOrganizer = await organizer.save();
    res.status(201).json(savedOrganizer);
  } catch (error) {
    console.error("Error creating organizer:", error);
    res.status(500).json({ message: "Error creating organizer" });
  }
});

// GET: Retrieve a single organizer by ID
router.get("/:id", async (req, res) => {
  try {
    const organizer = await Organizers.findById(req.params.id);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }
    res.status(200).json(organizer);
  } catch (error) {
    console.error("Error fetching organizer:", error);
    res.status(500).json({ message: "Error fetching organizer" });
  }
});

// GET all organizers (no filters)
router.get("/all", async (req, res) => {
  try {
    console.warn("Fetching all organizers -- do not use this");
    const organizers = await Organizers.find({});
    res.status(200).json(organizers);
  } catch (error) {
    console.error("Error fetching all organizers:", error);
    res.status(500).json({ message: "Error fetching all organizers" });
  }
});

// serverOrganizer.js

// PUT: Add an image to an organizer's images array
router.put("/:id/add-image", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const updatedOrganizer = await Organizers.findByIdAndUpdate(
      req.params.id,
      { $push: { images: imageUrl } },
      { new: true },
    );
    if (!updatedOrganizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }
    res.status(200).json(updatedOrganizer);
  } catch (error) {
    console.error("Error updating organizer images:", error);
    res.status(500).json({ message: "Error updating organizer images" });
  }
});

// GET: Retrieve organizers filtered by region, division, and city
router.get("/", async (req, res) => {
  const { region, division, city } = req.query; // Extract region, division, city from query parameters

  try {
    let query = { activeFlag: true, isEnabled: true }; // Base query for active organizers

    // If a region is provided, filter by organrun izerRegion
    if (region) query.organizerRegion = region;

    // If a division is provided, filter by organizerDivision
    if (division) query.organizerDivision = division;

    // If a city is provided, filter by organizerCity
    if (city) query.organizerCity = city;

    const organizers = await Organizers.find(query); // Fetch organizers matching the query
    res.status(200).json(organizers); // Return the filtered organizers
  } catch (error) {
    console.error("Error fetching organizers:", error);
    res.status(500).json({ message: "Error fetching organizers" });
  }
});

// PUT: Update an existing organizer by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedOrganizer = await Organizers.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedOrganizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }
    res.status(200).json(updatedOrganizer);
  } catch (error) {
    console.error("Error updating organizer:", error);
    res.status(500).json({ message: "Error updating organizer" });
  }
});

// DELETE: Delete an organizer by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedOrganizer = await Organizers.findByIdAndDelete(req.params.id);
    if (!deletedOrganizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }
    res.status(200).json({ message: "Organizer deleted" });
  } catch (error) {
    console.error("Error deleting organizer:", error);
    res.status(500).json({ message: "Error deleting organizer" });
  }
});

module.exports = router;
