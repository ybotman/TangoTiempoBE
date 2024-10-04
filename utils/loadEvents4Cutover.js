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
const LOAD_TO_MONGO = false; // Default is off
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
        // Extract and clean title
        let title = item.title || '';
        if (!title) {
          logger.warn('Event without title found, skipping.');
          continue;
        }
        //title = he.decode(title); // Decode HTML entities
        //title = cleanTitle(title);

        // Extract description
        let description = item['content:encoded'] || '';
        description = he.decode(description);

        // Remove accents from description
        description = removeAccents(description);

    // Extract eventImage URL
    let eventImage = '';

    // Check for image URL in various item properties
    if (item['media:content'] && item['media:content']['$'] && item['media:content']['$']['url']) {
      eventImage = item['media:content']['$']['url'];
    } else if (item['media:thumbnail'] && item['media:thumbnail']['$'] && item['media:thumbnail']['$']['url']) {
      eventImage = item['media:thumbnail']['$']['url'];
    } else if (item['enclosure'] && item['enclosure']['$'] && item['enclosure']['$']['url']) {
      eventImage = item['enclosure']['$']['url'];
    } else {
      // Try to extract image URL from description
      const imgRegex = /<img.*?src=["'](.*?)["']/;
      const imgMatch = description.match(imgRegex);
      if (imgMatch && imgMatch[1]) {
        eventImage = imgMatch[1];
      }
    }
        
        // Extract standardTitle from dc:creator
        const standardsTitle = 'ExtractedViaBTC';

        // Extract metadata from <wp:postmeta>
        const meta = item['wp:postmeta'] || [];
        let startDate = null;
        let endDate = null;
        let venueId = null;
        let organizerId = null;
        let cost = '';
        let recurrenceRule = '';

        // Ensure meta is always an array
        const metaArray = Array.isArray(meta) ? meta : [meta];

        for (const entry of metaArray) {
          const metaKey = entry['wp:meta_key'];
          const metaValue = entry['wp:meta_value'];

          if (metaKey === '_EventStartDate') startDate = metaValue;
          if (metaKey === '_EventEndDate') endDate = metaValue;
          if (metaKey === '_EventVenueID') venueId = metaValue;
          if (metaKey === '_EventOrganizerID') organizerId = metaValue;
          if (metaKey === '_EventCost') cost = metaValue;
          if (metaKey === '_EventRecurrence') recurrenceRule = metaValue;
          if (metaKey === 'category') categoriesMeta.push(metaValue);
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

        // Skip events without dates
        if (!startDate || !endDate) {
          logger.warn(`Event ${title} does not have valid start or end dates, skipping.`);
          continue;
        }

        // Parse dates
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        // Map categories
        // Extract and map categories from XML
let categoriesMeta = []; // Initialize array to hold the categories

// Assuming 'item' is the current event item you're processing
if (item['category']) {
  const categoryItems = Array.isArray(item['category']) ? item['category'] : [item['category']];

  for (const catItem of categoryItems) {
    if (catItem['$'] && catItem['$']['domain'] === 'tribe_events_cat') {
      const categoryName = catItem['_'] ? catItem['_'].toLowerCase() : '';
      categoriesMeta.push(categoryName);
    }
  }
}

// Now map the categoriesMeta to the actual category values
let categoryFirst = 'Unknown'; // Default to 'Unknown'
for (const cat of categoriesMeta) {
  if (cat.includes('class') || cat.includes('drop-in-class')) {
    categoryFirst = 'Class';
    break;
  } else if (cat.includes('practica')) {
    categoryFirst = 'Practica';
    break;
  } else if (cat.includes('milonga')) {
    categoryFirst = 'Milonga';
    break;
  } else if (cat.includes('festival')) {
    categoryFirst = 'Festival';
    break;
  } else if (cat.includes('workshop')) {
    categoryFirst = 'Workshop';
    break;
  } else if (cat.includes('canceled')) {
    categoryFirst = 'Canceled';
    break;
  }
}

        // Get category ID
        const category = categories.find(cat => cat.categoryName === categoryFirst) || categories.find(cat => cat.categoryName === 'Unknown');

            // Prepare event data
    const eventData = {
      title,
      standardsTitle,
      description,
      startDate,
      endDate,
      categoryFirst: category.categoryName,
      categorySecond: null,
      categoryThird: null,
      regionName: 'Northeast', // Default value
      regionID: '66c4d99042ec462ea22484bd',
      ownerOrganizerID: null,
      ownerOrganizerName: '',
      calculatedRegionName: '',
      calculatedDivisionName: '',
      calculatedCityName: '',
      eventImage: eventImage, // Set the extracted eventImage URL
      locationID: null,
      locationName: '',
      recurrenceRule: '', // Placeholder, could be set if recurrence is handled
      active: true,
      featured: false,
      canceled: false,
      cost: cost || '',
      expiresAt: endDate // Using endDate as expiresAt
    };
      

        // Remove formatting characters from title
        eventData.title = cleanTitle(eventData.title);

        // Remove accents from description
        eventData.description = removeAccents(eventData.description);

        // Only proceed if we have a title and startDate
        if (!eventData.title || !eventData.startDate) {
          logger.warn(`Event ${title} is missing title or start date, skipping.`);
          continue;
        }

        // Lookup location ID
        if (LOAD_TO_MONGO && venueId) {
          const venueMeta = await Locations.findOne({ name: venueId });
          if (venueMeta) {
            eventData.locationID = venueMeta._id;
            eventData.locationName = venueMeta.name;
          } else {
            logger.warn(`Venue with ID ${venueId} not found for event ${title}`);
          }
        }

        // Lookup organizer ID
        if (LOAD_TO_MONGO && standardsTitle) {
          const organizerMeta = await Organizers.findOne({ standardsTitle });
          if (organizerMeta) {
            eventData.ownerOrganizerID = organizerMeta._id;
            eventData.ownerOrganizerName = organizerMeta.name;
          } else {
            logger.warn(`Organizer with standardsTitle ${standardsTitle} not found for event ${title}`);
          }
        } else {
          // If organizer not found, set defaults
          eventData.ownerOrganizerID = null;
          eventData.ownerOrganizerName = item['dc:creator'] ? item['dc:creator'] : '';
        }

        // If LOAD_TO_MONGO is true, save to MongoDB
        if (LOAD_TO_MONGO) {
          // Lookup region ID
          const region = await Regions.findOne({ regionName: eventData.regionName });
          if (region) {
            eventData.regionID = region._id;
          } else {
            logger.warn(`Region ${eventData.regionName} not found for event ${title}`);
          }

          // Create new event
          const newEvent = new Events(eventData);
          await newEvent.save();
          logger.info(`Event ${title} inserted successfully into MongoDB.`);
        }

        // If OUTPUT_TO_JSON is true, add to outputEvents array
        if (OUTPUT_TO_JSON) {
          outputEvents.push(eventData);
        }

        successfulEvents.push({ title });

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
