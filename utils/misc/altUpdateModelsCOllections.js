require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Configuration Settings
const configPath = path.join(__dirname, "../public/updateModelsCollections.json");
const mongoURI = process.env.MONGODB_URI;
const shouldRunUpdateModels = process.env.RUN_UPDATE_MODELS === 'Yes';

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
  logger.info(
    "RUN_UPDATE_MODELS is not set to 'Yes'. Exiting without updates.",
  );
  process.exit(0);
}

// Load JSON configuration file
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  config.updated = []; // Initialize `updated` to track modified collections
  config.error = [];   // Initialize `error` to track any errors
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

// Function to add `orderType` field using updateMany
async function addOrderTypeField(collectionName, defaultValue = "defaultOrderType") {
  try {
    let Model;
    try {
      Model = require(`../models/${collectionName.toLowerCase()}`);
      logger.info(`Successfully loaded model for collection: ${collectionName}`);
    } catch (error) {
      logger.error(`Failed to load model for collection: ${collectionName} - ${error.message}`);
      config.error.push({
        collection: collectionName,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return; // Skip processing this collection
    }

    logger.info(`Adding 'orderType' field to collection: ${collectionName}`);

    // Update all documents where 'orderType' does not exist
    const result = await Model.updateMany(
      { orderType: { $exists: false } },
      { $set: { orderType: defaultValue } }
    );

    if (result.nModified > 0) {
      logger.info(`Added 'orderType' to ${result.nModified} documents in ${collectionName}`);
      config.updated.push({
        collectionName,
        updatedCount: result.nModified,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.info(`No documents needed updating in ${collectionName}`);
    }
  } catch (error) {
    logger.error(`Error updating collection: ${collectionName}: ${error.message}`);
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
    await addOrderTypeField(collectionName);
  }

  logger.info(
    `Update process complete. Updated collections: ${config.updated.map(c => c.collectionName).join(", ")}`,
  );
  mongoose.connection.close();
}

// MongoDB connection function with retry logic
async function connectWithRetry() {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
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