// ./utils/migrateLocations.js

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
const Locations = require('../models/locations');
const Regions = require('../models/regions'); // Use the updated Regions schema

async function migrateLocations() {
  // Check if the migration should run
  if (process.env.ImportBTCLocations !== 'true') {
    logger.info('ImportBTCLocations is not set to true. Migration skipped.');
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

  // Fetch Venue (Location) Data from the API
  const apiEndpoint = 'https://bostontangocalendar.com/wp-json/tribe/events/v1/venues';
  let venuesData;

  try {
    const response = await axios.get(apiEndpoint);
    venuesData = response.data.venues;
    if (!venuesData || venuesData.length === 0) {
      logger.warn('No venues data found from API.');
      await mongoose.connection.close();
      return;
    }
    logger.info(`Fetched ${venuesData.length} venues from API.`);
  } catch (error) {
    logger.error(`Error fetching data from API: ${error.message}`);
    await mongoose.connection.close();
    return;
  }

  // Iterate over each venue and process
  for (const venue of venuesData) {
  try {
    // Transform the data according to your schema
    const transformedLocation = {
      name: venue.venue || 'Unknown',
      address_1: venue.address || 'Unknown',
      state: venue.state || 'Unknown',
      city: venue.city || 'Unknown',
      zip: venue.zip || '00000',
      country: 'USA', // Assuming all data is from the USA
      latitude: venue.latitude || 0, // Defaulting latitude to 0
      longitude: venue.longitude || 0, // Defaulting longitude to 0
      geolocation: {
        type: 'Point',
        coordinates: [venue.longitude || 0, venue.latitude || 0], // Ensuring valid numeric values
      },
      calculatedRegion: defaultRegion,
      calculatedDivision: defaultDivision,
      calculatedCity: defaultCity,
      activeFlag: true,
      lastUsed: new Date(), // Set to the current date
    };

    // Upsert the location into MongoDB
    const result = await Locations.updateOne(
      { name: transformedLocation.name, address_1: transformedLocation.address_1 },
      { $set: transformedLocation },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      logger.info(`Location "${transformedLocation.name}" inserted.`);
    } else if (result.modifiedCount > 0) {
      logger.info(`Location "${transformedLocation.name}" updated.`);
    } else {
      logger.info(`Location "${transformedLocation.name}" already up-to-date.`);
    }
  } catch (error) {
    logger.error(`Error processing location "${venue.venue}": ${error.message}`);
  }
}

  // Close MongoDB connection
  await mongoose.connection.close();
  logger.info('MongoDB connection closed.');

  // Reset the ImportBTCLocations environment variable to false
  resetImportBTCLocations();
}

// Function to reset ImportBTCLocations in the .env file
function resetImportBTCLocations() {
  try {
    const envFilePath = path.resolve(__dirname, '../.env');
    const envFileContent = require('fs').readFileSync(envFilePath, 'utf-8');

    // Update the file content
    const updatedEnv = envFileContent
      .split('\n')
      .map(line => (line.startsWith('ImportBTCLocations=') ? 'ImportBTCLocations=false' : line))
      .join('\n');

    require('fs').writeFileSync(envFilePath, updatedEnv);
    logger.info('ImportBTCLocations has been set to false in .env file.');

    // Update the environment variable for the current process runtime
    process.env.ImportBTCLocations = 'false';
    logger.info('ImportBTCLocations has been set to false in current process runtime.');
  } catch (error) {
    logger.error(`Error updating .env file: ${error.message}`);
  }
}

// Run the migration
migrateLocations();