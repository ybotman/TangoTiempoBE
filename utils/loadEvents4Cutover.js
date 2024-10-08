const fs = require('fs');
const mongoose = require('mongoose');
const xml2js = require('xml2js');
const winston = require('winston');
const dotenv = require('dotenv');
const he = require('he'); // For decoding HTML entities
const removeAccents = require('remove-accents'); // For removing accents

// Load environment variables from .env file
dotenv.config();

const Events = require('../models/events.js'); // Assuming the model file is named events.js
const Locations = require('../models/locations.js');
const Organizers = require('../models/organizers.js');
const Regions = require('../models/regions.js');

// Set these flags as per your requirements
const LOAD_TO_MONGO = true; // Default is off
const OUTPUT_TO_JSON = true; // Default is on
const mongoURI = process.env.MONGODB_URI;
const parser = new xml2js.Parser({ explicitArray: false });

// Setup winston logger for events
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: './utils/XMLData4Cutover/logs/events_load.log' }) // Event-specific log
  ]
});

// Categories mapping
const categories = [
  { _id: '66c4d370a87a956db06c49e9', categoryName: 'Milonga', categoryCode: 'M' },
  { _id: '66c4d370a87a956db06c49ea', categoryName: 'Practica', categoryCode: 'P' },
  { _id: '66c4d370a87a956db06c49eb', categoryName: 'Class', categoryCode: 'C' },
  { _id: '66c4d370a87a956db06c49ec', categoryName: 'Festival', categoryCode: 'F' },
  { _id: '66c4d370a87a956db06c49ed', categoryName: 'Workshop', categoryCode: 'W' },
  { _id: '66c4d370a87a956db06c49ee', categoryName: 'Trip', categoryCode: 'T' },
  { _id: '66c4d370a87a956db06c49ef', categoryName: 'Virtual', categoryCode: 'V' },
  { _id: '6700251d9bde2a0fb8166f85', categoryName: 'Unknown', categoryCode: 'U' },
  { _id: '6700258c9bde2a0fb8166f87', categoryName: 'DayWorkshop', categoryCode: 'D' },
];

let loadMechismDate = 'BTC-' + new Date().toISOString();
// Helper function to clean titles
function cleanTitle(title) {
  // Remove accents and special characters
  title = removeAccents(title);
  // Remove bolding, quotes, slashes, emojis, and formatting characters
  title = title.replace(/[^\w\s]/gi, '');
  // Trim extra spaces
  return title.trim();
}

async function loadEvents() {
  try {
    logger.info('Starting event loading process...');

    // Check if files exist
    const seriesFilePath = './utils/XMLData4Cutover/bostontangocalendar.WordPress.2024-10-03.series.xml';
    const eventsFilePath = './utils/XMLData4Cutover/bostontangocalendar.WordPress.2024-10-03.events.xml';

    if (!fs.existsSync(seriesFilePath) || !fs.existsSync(eventsFilePath)) {
      throw new Error('Series or Events XML file not found.');
    }

    // Read XML files
    const seriesXmlData = fs.readFileSync(seriesFilePath, 'utf8');
    const eventsXmlData = fs.readFileSync(eventsFilePath, 'utf8');

    // Parse XML files
    const seriesResult = await parser.parseStringPromise(seriesXmlData);
    const eventsResult = await parser.parseStringPromise(eventsXmlData);

    const seriesItems = seriesResult.rss.channel.item || [];
    const eventItems = eventsResult.rss.channel.item || [];

    logger.info(`Found ${seriesItems.length} series and ${eventItems.length} events to process.`);

    // Merge series and events items
    const allItems = [...seriesItems, ...eventItems];

    const failedEvents = [];
    const successfulEvents = [];
    const outputEvents = [];

    // Connect to MongoDB if loading to Mongo
    if (LOAD_TO_MONGO) {
      logger.info('Connecting to MongoDB...');
      await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
      logger.info('MongoDB connected');
    }

    
    
    for (const item of allItems) {
  try {
    // Initialize eventData object at the start of each loop iteration
    const eventData = {}; // This ensures eventData is always initialized

    // Extract and clean title
    let title = item.title || '';
    if (!title) {
      logger.warn('Event without title found, skipping.');
      continue;
    }

    // Decode HTML entities and clean title
    eventData.title = he.decode(title);
    eventData.description = removeAccents(item['content:encoded'] || '');
    eventData.tmpEventload = loadMechismDate; // Add tmpEventload to eventDat

    // Extract metadata from <wp:postmeta>
    const meta = item['wp:postmeta'] || [];
    
    // Initialize variables for metadata fields
    let startDate = null;
    let endDate = null;
    let venueId = null;
    let organizerId = null;
    let cost = '';
    let tempMix = '';
    let tmpVenueId = null;
    let tmpUrl = null;
    let tmpCreator = null;
    let tmpEventOrgId = null;

    // Ensure meta is always an array
    const metaArray = Array.isArray(meta) ? meta : [meta];

    // Iterate through meta data and assign values conditionally
    for (const entry of metaArray) {
      const metaKey = entry['wp:meta_key'];
      const metaValue = entry['wp:meta_value'];

      // Map the relevant metadata to the corresponding variables
      if (metaKey === '_EventStartDate') {
        startDate = metaValue;
      }
      if (metaKey === '_EventEndDate') {
        endDate = metaValue;
      }
      if (metaKey === '_EventVenueID') {
        venueId = metaValue;
        tmpVenueId = metaValue || tmpVenueId;  // Map to tmpVenueId, only if metaValue exists
      }
      if (metaKey === '_EventOrganizerID') {
        organizerId = metaValue;
        tmpCreator = metaValue || tmpCreator;  // Map to tmpCreator, only if metaValue exists
        tmpEventOrgId = metaValue || tmpEventOrgId;
      }
      if (metaKey === '_EventCost') {
        cost = metaValue;
      }
      if (metaKey === '_EventURL') {
        tmpUrl = metaValue || tmpUrl;  // Map to tmpUrl, only if metaValue exists
      }
      if (metaKey === '_EventRecurrence') {
        tmpMix = metaValue;
      }
      if (metaKey === 'category') {
        categoriesMeta.push(metaValue);
      }
      if (metaKey === '_tribe_blocks_recurrence_rules') {
        // Parse recurrence rules
        try {
          const recurrenceData = JSON.parse(metaValue);
          recurrenceRule = recurrenceData[0]; // Assuming the first rule
        } catch (e) {
          logger.warn(`Failed to parse recurrence rules for event ${title}`);
        }
      }
    }

    // Skip events without valid start or end dates
    if (!startDate || !endDate) {
      logger.warn(`Event ${title} does not have valid start or end dates, skipping.`);
      continue;
    }

    // Parse dates
    eventData.startDate = new Date(startDate);
    eventData.endDate = new Date(endDate);

    // Assign additional event data with default values
    eventData.tmpVenueId = tmpVenueId || '66ce24219dba0abc71c2c7d6';  // Default locationID
    eventData.tmpUrl = tmpUrl || '';  // Ensure URL is not empty
    eventData.tmpCreator = tmpCreator || '';  // Ensure creator is not empty
    eventData.tmpEventOrgId = tmpEventOrgId || '66fed93f6ab695d2c6dbc79c';  // Default unknown organizer ID
    eventData.cost = cost;
    eventData.tmpMix = tmpMix;
    eventData.expiresAt = new Date('2026-01-01');  // Default expiration date
    eventData.regionName = 'Northeast';
    eventData.regionID = '66c4d99042ec462ea22484bd';  // Default regionID
    eventData.locationID = '66c8bc4c6b597390419b9187'
    eventData.calculatedRegionName = 'Northeast';  // Default regionName
    eventData.ownerOrganizerName = eventData.tmpCreator || 'BostonTango';  // Default organizer name
    eventData.ownerOrganizerID = '66c8bd338593d5136d3fdf0b';  // Default organizer ID
    eventData.categoryFirst = 'Unknown';  // Default category if none found

    // Log the processed event data before saving
    logger.info(`Processed event data: ${JSON.stringify(eventData)}`);

    // Only proceed if we have a title and startDate
    if (!eventData.title || !eventData.startDate) {
      logger.warn(`Event ${title} is missing title or start date, skipping.`);
      continue;
    }

    // Lookup location ID if required
    if (LOAD_TO_MONGO && venueId) {
      const venueMeta = await Locations.findOne({ name: venueId });
      if (venueMeta) {
        eventData.locationID = venueMeta._id;
        eventData.locationName = venueMeta.name;
      } else {
        logger.warn(`Venue with ID ${venueId} not found for event ${title}`);
      }
    }

    // Lookup organizer ID if required
    if (LOAD_TO_MONGO && eventData.tmpCreator) {
      const organizerMeta = await Organizers.findOne({ standardsTitle: eventData.tmpCreator });
      if (organizerMeta) {
        eventData.ownerOrganizerID = organizerMeta._id;
        eventData.ownerOrganizerName = organizerMeta.name;
      } else {
        logger.warn(`Organizer with standardsTitle ${eventData.tmpCreator} not found for event ${title}`);
      }
    }

    // Add eventData to outputEvents
    outputEvents.push(eventData); // Make sure the eventData is added to outputEvents

    // Save to MongoDB if required
    if (LOAD_TO_MONGO) {
      const newEvent = new Events(eventData);
      await newEvent.save();
      logger.info(`Event ${title} inserted successfully into MongoDB.`);
    }

  } catch (error) {
    logger.error(`Error processing event: ${item.title} - ${error.message}`);
    failedEvents.push({ title: item.title, error: error.message });
  }
}

    // Save the successful and failed event data to files in XMLData4Cutover folder
    fs.writeFileSync('./utils/XMLData4Cutover/logs/successfulEvents.json', JSON.stringify(successfulEvents, null, 2));
    fs.writeFileSync('./utils/XMLData4Cutover/logs/failedEvents.json', JSON.stringify(failedEvents, null, 2));

    // Save the output events to JSON file
    if (OUTPUT_TO_JSON) {
      fs.writeFileSync('./utils/XMLData4Cutover/logs/outputEvents.json', JSON.stringify(outputEvents, null, 2));
      logger.info('Output events saved to JSON file.');
    }

    logger.info('Event loading process complete.');

    if (LOAD_TO_MONGO) {
      mongoose.connection.close();
    }

  } catch (err) {
    logger.error('Error processing events: ' + err.message);
    if (LOAD_TO_MONGO) {
      mongoose.connection.close();
    }
  }
}

loadEvents();
