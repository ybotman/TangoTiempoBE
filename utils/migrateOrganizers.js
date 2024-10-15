// ./utils/migrateOrganizers.js

require('dotenv').config(); // Load environment variables from .env
const axios = require('axios');
const mongoose = require('mongoose');
const winston = require('winston');
const path = require('path');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    // Additional transports like File can be added here
  ],
});

// Import models
const Organizers = require('../models/organizers');
const Regions = require('../models/regions'); // Use the updated Regions schema

async function migrateOrganizers() {
  // Check if the migration should run
  if (process.env.ImportBTCOrganizers !== 'true') {
    logger.info('ImportBTCOrganizers is not set to true. Migration skipped.');
    return;
  }

  // Connect to MongoDB
  const mongoURI = process.env.MONGODB_URI;
  try {
    await mongoose.connect(mongoURI);
    logger.info('MongoDB connected successfully.');
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    return;
  }

  // Fetch default region, division, and city information
  let defaultRegion, defaultDivision, defaultCity;

  try {
    const region = await Regions.findOne({ regionName: 'Northeast' });
    if (!region) throw new Error('Region "Northeast" not found');

    defaultRegion = region._id;

    const division = region.divisions.find(div => div.divisionName === 'New England');
    if (!division) throw new Error('Division "New England" not found in region "Northeast"');

    defaultDivision = division._id;

    const city = division.majorCities.find(city => city.cityName === 'Boston');
    if (!city) throw new Error('City "Boston" not found in division "New England"');

    defaultCity = city._id;
  } catch (error) {
    logger.error(`Error fetching default location data: ${error.message}`);
    await mongoose.connection.close();
    return;
  }

  // Fetch Organizer Data from the API
  const apiEndpoint = 'https://bostontangocalendar.com/wp-json/tribe/events/v1/organizers';
  let organizersData;

  try {
    const response = await axios.get(apiEndpoint);
    organizersData = response.data.organizers;
    if (!organizersData || organizersData.length === 0) {
      logger.warn('No organizers data found from API.');
      await mongoose.connection.close();
      return;
    }
    logger.info(`Fetched ${organizersData.length} organizers from API.`);
  } catch (error) {
    logger.error(`Error fetching data from API: ${error.message}`);
    await mongoose.connection.close();
    return;
  }

  // Iterate over each organizer and process
  for (const organizer of organizersData) {
    try {
      // Transform the data according to your schema
      const transformedOrganizer = {
        name: organizer.organizer || 'Unknown',
        shortName: organizer.slug || 'unknown',
        btcNiceName: organizer.slug || 'unknown',
        organizerRegion: defaultRegion,
        organizerDivision: defaultDivision,
        organizerCity: defaultCity,
        firebaseUserId: organizer.slug || 'unknown', // Adjust as needed
        url: organizer.website || '',
        description: organizer.description || '',
        images: [],
        phone: organizer.phone || '',
        publicEmail: organizer.email || '',
        loginId: organizer.slug || '',
        activeFlag: true,
        lastActivity: new Date(),
        paymentTier: 'free',
        paidBool: false,
      };

      // Handle images
      if (organizer.image && organizer.image.url) {
        transformedOrganizer.images.push({ imageUrl: organizer.image.url, imageType: 'banner' });
      }

      // Upsert the organizer into MongoDB
      const result = await Organizers.updateOne(
        { name: transformedOrganizer.name },
        { $set: transformedOrganizer },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        logger.info(`Organizer "${transformedOrganizer.name}" inserted.`);
      } else if (result.modifiedCount > 0) {
        logger.info(`Organizer "${transformedOrganizer.name}" updated.`);
      } else {
        logger.info(`Organizer "${transformedOrganizer.name}" already up-to-date.`);
      }
    } catch (error) {
      logger.error(`Error processing organizer "${organizer.organizer}": ${error.message}`);
    }
  }

  // Close MongoDB connection
  await mongoose.connection.close();
  logger.info('MongoDB connection closed.');

  // Reset the ImportBTCOrganizers environment variable to false
  resetImportBTCOrganizers();
}

// Function to reset ImportBTCOrganizers in the .env file and in memory
function resetImportBTCOrganizers() {
  try {
    const envFilePath = path.resolve(__dirname, '../.env');
    const envFileContent = require('fs').readFileSync(envFilePath, 'utf-8');

    // Update the file content
    const updatedEnv = envFileContent
      .split('\n')
      .map(line => (line.startsWith('ImportBTCOrganizers=') ? 'ImportBTCOrganizers=false' : line))
      .join('\n');

    require('fs').writeFileSync(envFilePath, updatedEnv);
    logger.info('ImportBTCOrganizers has been set to false in .env file.');

    // Update the environment variable for the current process runtime
    process.env.ImportBTCOrganizers = 'false';
    logger.info('ImportBTCOrganizers has been set to false in current process runtime.');
  } catch (error) {
    logger.error(`Error updating .env file: ${error.message}`);
  }
}

// Run the migration
migrateOrganizers();