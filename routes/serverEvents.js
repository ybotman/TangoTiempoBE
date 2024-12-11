// routes/serverEvents.js
const express = require("express");
const router = express.Router();
const Events = require("../models/events");
const rateLimiter = require("../middleware/rateLimiter");
const logger = require("../utils/logger");
// Apply rate limiter to all routes in this router
router.use(rateLimiter);

// Logging middleware for POST, PUT, DELETE
router.use((req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    logger.info(
      `Event ${req.method} request, URL: ${req.originalUrl}, Body: ${JSON.stringify(req.body)}, IP: ${req.ip}`,
    );
  }
  next();
});

// Get all events
router.get("/all", async (req, res) => {
  try {
    const events = await Events.find();
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Error fetching events" });
  }
});

// Get events by calculated locations
// Get events by mastered locations
router.get("/byMasteredLocations", async (req, res) => {
  try {
    const {
      masteredRegionName,
      masteredDivisionName,
      masteredCityName,
      start,
      end,
      active,
    } = req.query;

    // Validate required parameters
    if ((!masteredRegionName && !masteredDivisionName && !masteredCityName) || !start || !end) {
      console.error(
        `Missing parameters: masteredRegionName=${masteredRegionName}, masteredDivisionName=${masteredDivisionName}, masteredCityName=${masteredCityName}, start=${start}, end=${end}`
      );
      return res.status(400).json({
        message:
          "At least one of masteredRegionName, masteredDivisionName, or masteredCityName is required. Start date and end date are also required.",
      });
    }

    // Parse and validate date range
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) {
      console.error(`Invalid date range: start=${start}, end=${end}`);
      return res.status(400).json({ message: "Invalid start or end date format." });
    }

    // Parse active flag (default to true if not provided)
    const isActive = active === undefined || active === "true";

    // Build query
    const query = {
      startDate: { $gte: startDate, $lte: endDate },
      active: isActive,
    };

    // Add location filters if provided
    if (masteredRegionName) {
      query.masteredRegionName = masteredRegionName;
    }
    if (masteredDivisionName) {
      query.masteredDivisionName = masteredDivisionName;
    }
    if (masteredCityName) {
      query.masteredCityName = masteredCityName;
    }

    console.log("BE: byMasteredLocations--> Querying events with:", query);

    // Fetch events
    const events = await Events.find(query).sort({ startDate: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Error fetching events" });
  }
});


// Get events by region and category (event type)
router.get("/byRegionAndCategory", async (req, res) => {
  try {
    const {
      masteredRegionName,
      masteredDivisionName,
      masteredCityName,
      start,
      end,
      active,
      category, // New category filter
    } = req.query;

    if (
      !masteredRegionName ||
      !start ||
      !end ||
      active === undefined ||
      !category
    ) {
      return res.status(400).json({
        message:
          "Region, start date, end date, active status, and category are required",
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const isActive = active === "true";

    const query = {
      masteredRegionName,
      startDate: { $gte: startDate, $lte: endDate },
      active: isActive,
      category, // Filter by category (event type)
    };

    if (masteredDivisionName) {
      query.masteredDivisionName = masteredDivisionName;
    }

    if (masteredCityName) {
      query.masteredCityName = masteredCityName;
    }

    const events = await Events.find(query).sort({ startDate: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events by region and category:", error);
    res
      .status(500)
      .json({ message: "Error fetching events by region and category" });
  }
});

// Get event by ID
router.get("/id/:id", async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await Events.findById(eventId);
    if (event) {
      res.status(200).json(event);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    res.status(500).json({ message: "Error fetching event by ID" });
  }
});

// Get events by owner
router.get("/owner/:ownerId", async (req, res) => {
  const ownerId = req.params.ownerId;

  try {
    const eventsByOwner = await Events.find({
      $or: [
        { ownerOrganizerID: ownerId },
        { grantedOrganizerID: ownerId },
        { alternateOrganizerID: ownerId },
      ],
    });

    res.status(200).json(eventsByOwner);
  } catch (error) {
    console.error("Error fetching events by ownerOrganizer:", error);
    res.status(500).json({ message: "Error fetching events by organizer" });
  }
});

// Update an event
router.put("/:eventId", async (req, res) => {
  const eventId = req.params.eventId;
  const updatedEventData = req.body;

  try {
    const eventToUpdate = await Events.findById(eventId);
    if (!eventToUpdate) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    Object.assign(eventToUpdate, updatedEventData);
    await eventToUpdate.save();
    res.status(200).json(eventToUpdate);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Error updating event" });
  }
});

// Create a new event with a CRUD endpoint
router.post("/post", async (req, res) => {
  const eventData = req.body;
  const userRole = req.user.role; // Assuming user role is passed in the request (from JWT or middleware)

  // Check if the user is an Active Regional Organizer
  if (userRole !== "RegionalOrganizer" || !req.user.isActive) {
    return res
      .status(403)
      .json({ message: "Only Active Regional Organizers can add events" });
  }

  // Ensure required fields are provided
  if (
    !eventData.title ||
    !eventData.startDate ||
    !eventData.endDate ||
    !eventData.ownerOrganizerID
  ) {
    return res.status(400).json({
      message: "Title, Start Date, End Date, and Organizer ID are required",
    });
  }

  // Location validation and assignment (assuming location data is sent in eventData)
  if (!eventData.locationID) {
    return res.status(400).json({ message: "Location is required" });
  }

  try {
    const newEvent = new Events(eventData);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Error creating event" });
  }
});
module.exports = router;
