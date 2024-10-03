const fs = require('fs');
const mongoose = require('mongoose');
const xml2js = require('xml2js');
const winston = require('winston');
const dotenv = require('dotenv');
const Organizers = require('../models/organizers.js');
const Regions = require('../models/regions.js');

// Load environment variables from .env file
dotenv.config();

const mongoURI = process.env.MONGODB_URI;
const parser = new xml2js.Parser({ explicitArray: false });

// Setup winston logger for organizers
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
        new winston.transports.File({ filename: './utils/XMLData4Cutover/logs/organizers_load.log' }) // Organizer-specific log
    ]
});

async function loadOrganizers() {
    try {
        logger.info('Connecting to MongoDB...');
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        logger.info('MongoDB connected');

        // Adjusted the XML file path to match your folder structure
        const xmlData = fs.readFileSync('./utils/XMLData4Cutover/bostontangocalendar.WordPress.2024-10-03 organizers.xml', 'utf8');

        // Parse the XML file
        parser.parseString(xmlData, async (err, result) => {
            if (err) throw err;

            const items = result.rss.channel.item || [];
            const failedOrganizers = [];
            const successfulOrganizers = [];

            logger.info(`Found ${items.length} organizers to process.`);

            for (const item of items) {
                try {
                    // Extract fields from XML
                    const name = item.title || 'Unknown Organizer';
                    const url = item.link;
                    const description = item['content:encoded'] || '';
                    const postId = item['wp:post_id'];
                    const cityName = 'Boston';  // Default to Boston for now
                    const regionName = 'Northeast';
                    const divisionName = 'New England';

                    // Extract metadata from <wp:postmeta>
                    const meta = item['wp:postmeta'] || [];
                    let phone = null, email = null, website = null;

                    // Ensure meta is always an array
                    const metaArray = Array.isArray(meta) ? meta : [meta];

                    for (const entry of metaArray) {
                        const metaKey = entry['wp:meta_key'];
                        const metaValue = entry['wp:meta_value'];
                        if (metaKey === '_OrganizerPhone') phone = metaValue;
                        if (metaKey === '_OrganizerEmail') email = metaValue;
                        if (metaKey === '_OrganizerWebsite') website = metaValue;
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

                    const city = division.majorCities.find(city => city.cityName === cityName) ||
                                division.majorCities.find(city => city.cityName === 'Boston'); // Default to Boston

                    if (!city) {
                        throw new Error(`City not found: ${cityName}`);
                    }

                    // Create new Organizer object
                    const newOrganizer = new Organizers({
                        name,
                        shortName: name,
                        organizerRegion: region._id,
                        organizerDivision: division._id,
                        organizerCity: city._id,
                        firebaseUserId: postId,  // Use post ID as firebaseUserId for now
                        url: website || url,
                        description,
                        images: [],  // No image data in the XML
                        phone,
                        publicEmail: email,
                        loginId: postId,  // Use post ID as login ID
                        activeFlag: true,
                        paymentTier: 'basic',
                        paidBool: true
                    });

                    await newOrganizer.save();
                    logger.info(`Organizer ${name} loaded successfully`);
                    successfulOrganizers.push({ name });

                } catch (error) {
                    logger.error(`Error loading organizer: ${item.title} - ${error.message}`);
                    failedOrganizers.push({ name: item.title, error: error.message });
                }
            }

            // Save the successful and failed organizer data to files in XMLData4Cutover folder
            fs.writeFileSync('./utils/XMLData4Cutover/logs/successfulOrganizers.json', JSON.stringify(successfulOrganizers, null, 2));
            fs.writeFileSync('./utils/XMLData4Cutover/logs/failedOrganizers.json', JSON.stringify(failedOrganizers, null, 2));
            logger.info('Organizer loading complete');

            mongoose.connection.close();
        });
    } catch (err) {
        logger.error('Error processing organizers: ' + err.message);
        mongoose.connection.close();
    }
}

loadOrganizers();