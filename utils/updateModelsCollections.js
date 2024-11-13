require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Set up logger with Winston for better diagnostic output
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`,
    ),
  ),
  transports: [new winston.transports.Console()],
});

// Load JSON configuration file from public directory
const configPath = path.join(
  __dirname,
  "../public/updateModelsCollections.json",
);
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  config.updated = []; // Initialize `updated` to track modified collections
  logger.info(`Loaded configuration: ${JSON.stringify(config, null, 2)}`);
} catch (error) {
  logger.error(`Failed to load configuration file: ${error.message}`);
  process.exit(1);
}

// Function to save configuration back to file
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    logger.info("Configuration saved successfully.");
  } catch (error) {
    logger.error(`Error saving configuration: ${error.message}`);
  }
}

// Function to update each document with missing fields in a given collection
async function updateCollectionWithDefaults(collectionName) {
  try {
    const Model = require(`../models/${collectionName.toLowerCase()}`);
    logger.info(`Processing collection: ${collectionName}`);

    const defaultDocument = new Model();
    const defaultValues = defaultDocument.toObject();

    const updateQuery = {
      $set: Object.keys(defaultValues).reduce((acc, field) => {
        if (field !== "_id") {
          // Exclude _id from updates
          acc[field] = defaultValues[field];
        }
        return acc;
      }, {}),
    };

    const result = await Model.updateMany(
      {
        $or: Object.keys(defaultValues).map((field) => ({
          [field]: { $exists: false },
        })),
      },
      updateQuery,
    );

    if (result.nModified > 0) {
      logger.info(
        `Updated ${result.nModified} documents in collection: ${collectionName}`,
      );
      config.updated.push(collectionName); // Track only modified collections
    } else {
      logger.info(`No updates needed for collection: ${collectionName}`);
    }
  } catch (error) {
    logger.error(
      `Error updating collection: ${collectionName}: ${error.message}`,
    );
    config.error.push({ collection: collectionName, error: error.message });
  }
  saveConfig(); // Save the updated config after each collection
}

// Main function to iterate over collections in the config file
async function runUpdates() {
  logger.info("Starting updates...");

  for (const collectionName of config.toRun) {
    await updateCollectionWithDefaults(collectionName);
  }

  logger.info("Update process complete.");
  mongoose.connection.close();
}

// Connect to MongoDB and execute updates
(async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    logger.error("MongoDB URI not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    logger.info("MongoDB connected successfully.");
    await runUpdates();
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
})();
