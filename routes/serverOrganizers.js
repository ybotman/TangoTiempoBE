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
const rateLimiter = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
// Apply rate limiter to all routes in this router
router.use(rateLimiter);

// Logging middleware for POST, PUT, DELETE
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    logger.info(`Organizer ${req.method} request, URL: ${req.originalUrl}, Body: ${JSON.stringify(req.body)}, IP: ${req.ip}`);
  }
  next();
});


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

router.get("/", async (req, res) => {
  const { region, division, city, isActive, wantRender, isEnabled } = req.query;

  try {
    console.warn("router.get orgs", req.query);
    let query = {};

    // Construct query only if parameters are provided
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (wantRender !== undefined) query.wantRender = wantRender === "true";
    if (isEnabled !== undefined) query.isEnabled = isEnabled === "true";

    if (region) query.organizerRegion = region;
    if (division) query.organizerDivision = division;
    if (city) query.organizerCity = city;

    // Enforce at least one query parameter
    if (Object.keys(query).length === 0) {
      console.warn("No query parameters provided. Cannot fetch all organizers.");
      return res.status(400).json({ message: "At least one filter parameter is required." });
    }

    // Log the constructed query
    console.log("Constructed query:", query);

    const organizers = await Organizers.find(query);
    res.status(200).json(organizers);
  } catch (error) {
    console.error("Error fetching organizers with filters:", error);
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
