require("dotenv").config();
const axios = require("axios");
const winston = require("winston");
const moment = require("moment");
const mongoose = require("mongoose");
const removeAccents = require("remove-accents");

// Load models
const Events = require("../models/events");
const Organizers = require("../models/organizers");
const Locations = require("../models/locations");
const Categories = require("../models/categories");
const he = require("he"); // Import to handle HTML entity decoding

// Category mapping
const categoryMapping = {
  "": "Unknown",
  Canceled: "Unknown",
  Class: "Class",
  "Concert/Show": "Concert/Show",
  "Drop-in Class": "Class",
  Festivals: "Festival",
  "First Timer Friendly": "Unknown",
  "Forum/RoundTable/Labs": "Unknown",
  "Live Orchestra": "Live",
  Milonga: "Milonga",
  Other: "Unknown",
  "Party/Gathering": "Unknown",
  Practica: "Practica",
  "Progressive Class": "Class",
  "Trips-Hosted": "Trips",
  Workshop: "Workshop",
  Undefined: "Unknown",
};

// Logger setup
const migrateLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "./utils/migrateLogs/migrate.log",
    }),
  ],
});

const deepLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "./utils/migrateLogs/migrateEvents.log",
    }),
  ],
});

let hasErrors = false; // Flag to track errors

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI)
  .then(() => deepLogger.info("MongoDB connected successfully."))
  .catch((err) => {
    deepLogger.error("MongoDB connection error:", err);
    hasErrors = true;
  });

// Event migration function
async function migrateEvents() {
  if (process.env.ImportBTCEvents !== "true") {
    migrateLogger.info(
      "ImportBTCEvents is not set to true. Migration skipped.",
    );
    return;
  }

  migrateLogger.info("Event migration started.");
  const startDate = moment("2024-05-01");
  const endDate = moment("2025-05-31");
  deepLogger.info(
    `------------  Starting importing of events for date Range: ${startDate} to ${endDate}  -------`,
  );

  for (let day = startDate; day.isSameOrBefore(endDate); day.add(1, "days")) {
    const dayString = day.format("YYYY-MM-DD");
    const apiUrl = `https://bostontangocalendar.com/wp-json/tribe/events/v1/events?start_date=${dayString}&end_date=${dayString}`;

    deepLogger.info(`Fetching events for ${dayString}`);

    let eventsData;
    try {
      const response = await axios.get(apiUrl);
      eventsData = response.data.events;
      deepLogger.info(`Found ${eventsData.length} events for ${dayString}`);
    } catch (error) {
      deepLogger.error(`Error fetching events: ${error.message}`);
      hasErrors = true;
      continue;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const event of eventsData) {
      try {
        const organizerName =
          event.organizer?.[0]?.organizer || "Organizer: Un-Identified, N/A";
        const organizer = await Organizers.findOne({ name: organizerName });

        if (!organizer) {
          throw new Error(`Organizer ${organizerName} not found`);
        }

        // Handle venue
        const venueName = event.venue?.venue || "Unknown";
        const location = await Locations.findOne({ name: venueName });

        if (!location) {
          throw new Error(`Location ${venueName} not found`);
        }
        // Map category
        let mappedCategory = "Unknown";
        event.categories.forEach((category) => {
          mappedCategory = categoryMapping[category.name] || "Unknown";
        });

        // Look up the category in MongoDB
        const category = await Categories.findOne({
          categoryName: mappedCategory,
        });
        if (!category) throw new Error(`Category ${mappedCategory} not found`);

        const eventTitle = he
          .decode(event.title || "")
          .normalize("NFKD") // Normalize to decompose special characters and accents
          .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks (accents, etc.)
          .replace(/[^a-zA-Z0-9 \-]/g, ""); // Keep letters, numbers, spaces, and hyphens.
        const eventDescription = he.decode(event.description || ""); // Retain HTML and special characters

        const tmpMix = {
          eventUrl: event.url || "",
          eventSlug: event.slug || "",
          additionalAttributes: event.unknownAttributes || {},
        };

        const transformedEvent = {
          title: eventTitle || null,
          description: eventDescription || null,
          categoryFirst: mappedCategory,
          startDate: new Date(event.start_date),
          endDate: new Date(event.end_date),
          startTime: `${event.start_date_details.hour}:${event.start_date_details.minutes}`,
          endTime: `${event.end_date_details.hour}:${event.end_date_details.minutes}`,
          ownerOrganizerID: organizer._id,
          ownerOrganizerName: organizer.name,
          locationID: location._id,
          locationName: location.name,
          eventImage: event.image?.url || null,
          calculatedRegionName: "Northeast",
          calculatedDivisionName: "New England",
          calculatedCityName: "Boston",
          tmpMix,
        };

        await Events.updateOne(
          {
            title: transformedEvent.title,
            startDate: transformedEvent.startDate,
          },
          { $set: transformedEvent },
          { upsert: true },
        );

        deepLogger.info(
          `Event "${transformedEvent.title}" on ${dayString} processed successfully.`,
        );
        successCount++;
      } catch (error) {
        deepLogger.error(
          `Error processing event "${event.title}": ${error.message}`,
        );
        hasErrors = true;
        errorCount++;
      }
    }

    deepLogger.info(
      `Day ${dayString}: Success: ${successCount}, Errors: ${errorCount}`,
    );
  }

  if (hasErrors) {
    migrateLogger.info("Event migration completed with errors.");
  } else {
    migrateLogger.info("Event migration completed successfully.");
  }
  deepLogger.info(
    `-------  Finished date Range ${startDate} to ${endDate}  -------`,
  );
}

// Run the migration
migrateEvents();
