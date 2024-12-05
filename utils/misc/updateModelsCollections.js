require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Configuration Settings
const BATCH_SIZE = 1000; // Batch size for processing large collections
const configPath = path.join(
  __dirname,
  "../public/updateModelsCollections.json",
);
const mongoURI = process.env.MONGODB_URI;
const shouldRunUpdateModels = process.env.RUN_UPDATE_MODELS === "Yes";

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

if (!shouldRunUpdateModels) {
  logger.info("RUN_UPDATE_MODELS is not set to true. Exiting without updates.");
  console.log(shouldRunUpdateModels);
  process.exit(0);
}

// Load JSON configuration file
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
async function saveConfig() {
  try {
    await fs.promises.writeFile(
      configPath,
      JSON.stringify(config, null, 2),
      "utf-8",
    );
    logger.info("Configuration saved successfully.");
  } catch (error) {
    logger.error(`Error saving configuration: ${error.message}`);
  }
}

async function updateCollectionWithDefaults(collectionName) {
  try {
    let Model;
    try {
      Model = require(`../models/${collectionName.toLowerCase()}`);
      logger.info(
        `Successfully loaded model for collection: ${collectionName}`,
      );
    } catch (error) {
      logger.error(
        `Failed to load model for collection: ${collectionName} - ${error.message}`,
      );
      config.error.push({
        collection: collectionName,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return; // Skip processing this collection
    }

    logger.info(`Processing collection: ${collectionName}`);

    const defaultDocument = new Model();
    const defaultValues = defaultDocument.toObject();
    delete defaultValues._id; // Exclude `_id` from updates
    logger.info(
      `Default values for ${collectionName}: ${JSON.stringify(defaultValues)}`,
    );

    let updatedCount = 0;

    // Find all documents in the collection
    const cursor = Model.find({}).batchSize(BATCH_SIZE).cursor();

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      const updates = {};

      // Add missing fields to the updates object
      for (const [key, value] of Object.entries(defaultValues)) {
        if (doc[key] === undefined || doc[key] === null) {
          updates[key] = value;
        } else if (typeof value === "object" && !Array.isArray(value)) {
          // Handle nested objects
          for (const [subKey, subValue] of Object.entries(value)) {
            if (doc[key]?.[subKey] === undefined || doc[key][subKey] === null) {
              updates[`${key}.${subKey}`] = subValue;
            }
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await Model.updateOne({ _id: doc._id }, { $set: updates });
        updatedCount++;
        logger.info(
          `Updated document ${doc._id} in ${collectionName} with updates: ${JSON.stringify(updates)}`,
        );
      } else {
        //      logger.info(`No updates needed for document ${doc._id} in ${collectionName}`);
        logger.info(".");
      }
    }

    if (updatedCount > 0) {
      //logger.info(`Updated ${updatedCount} documents in collection: ${collectionName}`);
      logger.info("+");
      config.updated.push({
        collectionName,
        updatedCount,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.info(`No updates needed for collection: ${collectionName}`);
    }
  } catch (error) {
    logger.error(
      `Error updating collection: ${collectionName}: ${error.message}`,
    );
    config.error.push({
      collection: collectionName,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
  await saveConfig(); // Save the updated config after each collection
}

// Main function to iterate over collections in the config file
async function runUpdates() {
  logger.info("Starting updates...");
  const updatedCollections = [];

  for (const collectionName of config.toRun) {
    const updated = await updateCollectionWithDefaults(collectionName);
    if (updated) updatedCollections.push(collectionName); // Track only if updated
  }

  logger.info(
    `Update process complete. Updated collections: ${updatedCollections.join(", ")}`,
  );
  mongoose.connection.close();
}

// MongoDB connection function with retry logic
async function connectWithRetry() {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(mongoURI);
      logger.info("MongoDB connected successfully.");
      return;
    } catch (error) {
      attempt++;
      logger.error(
        `MongoDB connection error (attempt ${attempt}): ${error.message}`,
      );
      if (attempt === MAX_RETRIES) process.exit(1);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retrying
    }
  }
}

// Execute updates
(async () => {
  if (!mongoURI) {
    logger.error("MongoDB URI not defined in environment variables.");
    process.exit(1);
  }

  await connectWithRetry();
  await runUpdates();
})();
