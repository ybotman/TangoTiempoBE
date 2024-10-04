const fs = require('fs');
const mongoose = require('mongoose');
const xml2js = require('xml2js');
const winston = require('winston');
const dotenv = require('dotenv');
const Locations = require('../models/locations.js'); // Assuming the model file is named locations.js
const Regions = require('../models/regions.js');

// Load environment variables from .env file
dotenv.config();

const mongoURI = process.env.MONGODB_URI;
const parser = new xml2js.Parser({ explicitArray: false });

// Setup winston logger for locations
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
        new winston.transports.File({ filename: './utils/XMLData4Cutover/logs/locations_load.log' }) // Location-specific log
    ]
});

async function loadLocations() {
    try {
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        logger.info('MongoDB connected');

        // Adjusted the XML file path to match your folder structure
        const xmlData = fs.readFileSync('./utils/XMLData4Cutover/bostontangocalendar.WordPress.2024-10-03 venues.xml', 'utf8');

        // Parse the XML file
        parser.parseString(xmlData, async (err, result) => {
            if (err) throw err;

            const items = result.rss.channel.item || [];
            const failedLocations = [];
            const successfulLocations = [];

            logger.info(`Found ${items.length} locations to process.`);

            for (const item of items) {
                try {
                    // Extract fields from XML
                    const name = item.title || 'Unknown Location';
                    const description = item['content:encoded'] || '';
                    const postId = item['wp:post_id'];
                    const regionName = 'Northeast';
                    const divisionName = 'New England';
                    const cityNameDefault = 'Boston';

                    // Extract metadata from <wp:postmeta>
                    const meta = item['wp:postmeta'] || [];
                    let address_1 = '';
                    let city = '';
                    let state = '';
                    let zip = '';
                    let country = 'USA'; // Default to USA
                    let latitude = null;
                    let longitude = null;
                    let imageUrl = null;

                    // Ensure meta is always an array
                    const metaArray = Array.isArray(meta) ? meta : [meta];

                    for (const entry of metaArray) {
                        const metaKey = entry['wp:meta_key'];
                        const metaValue = entry['wp:meta_value'];
                        if (metaKey === '_VenueAddress') address_1 = metaValue || '';
                        if (metaKey === '_VenueCity') city = metaValue || '';
                        if (metaKey === '_VenueState') state = metaValue || '';
                        if (metaKey === '_VenueZip') zip = metaValue || '';
                        if (metaKey === '_VenueCountry') country = metaValue || 'USA';
                        if (metaKey === '_VenueLat') latitude = parseFloat(metaValue) || null;
                        if (metaKey === '_VenueLng') longitude = parseFloat(metaValue) || null;
                        if (metaKey === '_thumbnail_id') imageUrl = metaValue || null; // Placeholder, needs mapping to actual image URL
                    }

                    // Use default city if not provided
                    if (!city) city = cityNameDefault;
                    if (!state) state = 'MA'; // Default to Massachusetts
                    if (!zip) zip = '02139'; // Default ZIP code

                    // Validate required fields
                    if (!address_1) {
                        logger.warn(`Address is missing for location: ${name}. Setting to 'Unknown Address'.`);
                        address_1 = 'Unknown Address';
                    }

                    // Lookup Region, Division, and City
                    const region = await Regions.findOne({ regionName });
                    if (!region) {
                        throw new Error(`Region not found: ${regionName}`);
                    }

                    const division = region.divisions.find(div => div.divisionName === divisionName);
                    if (!division) {
                        throw new Error(`Division not found in region: ${divisionName}`);
                    }

                    const cityObj = division.majorCities.find(c => c.cityName.toLowerCase() === city.toLowerCase()) ||
                                    division.majorCities.find(c => c.cityName === cityNameDefault);

                    if (!cityObj) {
                        throw new Error(`City not found: ${city}`);
                    }

                    // Construct geolocation if latitude and longitude are available
                    let geolocation = null;
                    if (latitude !== null && longitude !== null) {
                        geolocation = {
                            type: 'Point',
                            coordinates: [longitude, latitude] // Note: GeoJSON uses [longitude, latitude]
                        };
                    }

                    // Prepare Location object data
                    const locationData = {
                        name,
                        address_1,
                        address_2: '',
                        address_3: '',
                        state,
                        city,
                        zip,
                        country,
                        latitude,
                        longitude,
                        image: { imageUrl },
                        geolocation,
                        activeFlag: true,
                        lastUsed: null,
                        calculatedRegion: region._id,
                        calculatedDivision: division._id,
                        calculatedCity: cityObj._id
                    };

                    // Upsert logic: update if exists, insert if not
                    const existingLocation = await Locations.findOne({ name });
                    if (existingLocation) {
                        // Update existing location
                        await Locations.updateOne({ _id: existingLocation._id }, { $set: locationData });
                        logger.info(`Location ${name} updated successfully`);
                    } else {
                        // Insert new location
                        const newLocation = new Locations(locationData);
                        await newLocation.save();
                        logger.info(`Location ${name} inserted successfully`);
                    }
                    successfulLocations.push({ name });

                } catch (error) {
                    logger.error(`Error processing location: ${item.title} - ${error.message}`);
                    failedLocations.push({ name: item.title, error: error.message });
                }
            }

            // Save the successful and failed location data to files in XMLData4Cutover folder
            fs.writeFileSync('./utils/XMLData4Cutover/logs/successfulLocations.json', JSON.stringify(successfulLocations, null, 2));
            fs.writeFileSync('./utils/XMLData4Cutover/logs/failedLocations.json', JSON.stringify(failedLocations, null, 2));
            logger.info('Location processing complete');

            mongoose.connection.close();
        });
    } catch (err) {
        logger.error('Error processing locations: ' + err.message);
        mongoose.connection.close();
    }
}

loadLocations();