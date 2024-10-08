const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

// Import the schemas
const CategorySchema = require('../models/categories').schema;
const PermissionSchema = require('../models/permissions').schema;
const LocationSchema = require('../models/locations').schema;
const RoleSchema = require('../models/roles').schema;
const RegionSchema = require('../models/regions').schema;
const EventSchema = require('../models/events').schema;
const userLoginSchema = require('../models/userLogins').schema;

// Define the target URIs for each environment (P: Prod, T: Test, I: Intg)
const targetURIs = {
    P: process.env.PROD_DB_URI,
    T: process.env.TEST_DB_URI,
    I: process.env.INTG_DB_URI,
    S: process.env.SAND_DB_URI,
};

// Capture the argument from the command line (db choice)
const dbChoice = process.argv[2]; // Example usage: node script.js P

if (!dbChoice || !targetURIs[dbChoice]) {
    console.error('Please provide a valid database option: P (Prod), T (Test), I (Intg), or S (Sandbox)');
    process.exit(1);
}

// Function to update documents with new fields and default values
async function updateDocuments(collection, schema, connection) {
    console.log(`\nChecking collection: ${collection}`);

    const documents = await connection.model(collection, schema).find({});
    let totalUpdates = 0;

    for (const doc of documents) {
        let updates = {};

        Object.keys(schema.paths).forEach((key) => {
            if (!doc[key] && schema.paths[key].options.default) {
                updates[key] = schema.paths[key].options.default;
            }
        });

        if (Object.keys(updates).length > 0) {
            await connection.model(collection, schema).updateOne({ _id: doc._id }, { $set: updates });
            totalUpdates++;
        }
    }

    if (totalUpdates > 0) {
        console.log(` --> Updated ${totalUpdates} documents in collection: ${collection}`);
    } else {
        console.log(`No updates needed for collection: ${collection}`);
    }
}

// Function to check for missing required fields and raise alarms
async function checkIntegrity(collection, schema, connection) {
    console.log(`Checking integrity for collection: ${collection}`);

    const documents = await connection.model(collection, schema).find({});
    for (const doc of documents) {
        const missingFields = [];
        Object.keys(schema.paths).forEach((key) => {
            if (schema.paths[key].options.required && !doc[key]) {
                missingFields.push(key);
            }
        });

        if (missingFields.length > 0) {
            console.error(`Integrity issue in ${collection}: Missing required fields [${missingFields.join(', ')}]`);
        }
    }
}

// Main function to connect and sync the selected database
async function syncCollections() {
    try {
        const selectedURI = targetURIs[dbChoice];
        const targetConnection = await mongoose.createConnection(selectedURI);
        console.log(`Connected to the ${dbChoice} database with URI: ${selectedURI}`);

        const schemas = {
            Categories: CategorySchema,
            LocationSchema: LocationSchema,
            Permissions: PermissionSchema,
            Roles: RoleSchema,
            Regions: RegionSchema,
            Events: EventSchema,
            UserLogins: userLoginSchema,
        };

        for (const [collection, schema] of Object.entries(schemas)) {
            await updateDocuments(collection, schema, targetConnection);
            await checkIntegrity(collection, schema, targetConnection);
        }

        await targetConnection.close();
        console.log(`Disconnected from the ${dbChoice} database`);

    } catch (err) {
        console.error('Error during synchronization:', err);
    }
}

// Run the script
syncCollections();