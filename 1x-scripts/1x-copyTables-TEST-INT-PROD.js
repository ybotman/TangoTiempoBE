const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

// Import the schemas
const CategorySchema = require('./models/categories').schema;
const PermissionSchema = require('./models/permissions').schema;
const RoleSchema = require('./models/roles').schema;
const RegionSchema = require('./models/regions').schema;

// Define the source and target URIs
const sourceURI = process.env.MONGODB_URI; // Add this to your .env file
const targetURIs = {
    intg: process.env.INTG_DB_URI,
    test: process.env.TEST_DB_URI,
    prod: process.env.PROD_DB_URI,
};

async function copyData() {
    try {
        // Connect to the source database
        const sourceConnection = await mongoose.createConnection(sourceURI);
        console.log('Connected to source database');

        // Fetch data from the source collections
        const Categories = sourceConnection.model('Categories', CategorySchema);
        const Permissions = sourceConnection.model('Permission', PermissionSchema);
        const Roles = sourceConnection.model('Roles', RoleSchema);
        const Regions = sourceConnection.model('Regions', RegionSchema);

        const categoriesData = await Categories.find({});
        const permissionsData = await Permissions.find({});
        const rolesData = await Roles.find({});
        const regionsData = await Regions.find({});

        // Loop through target databases
        for (const [env, uri] of Object.entries(targetURIs)) {
            const targetConnection = await mongoose.createConnection(uri);

            console.log('          Database Change ');
            console.log(` *** Connected to ${env} database`);

            // Register the schemas with the target connection
            const TargetCategories = targetConnection.model('Categories', CategorySchema);
            const TargetPermissions = targetConnection.model('Permission', PermissionSchema);
            const TargetRoles = targetConnection.model('Roles', RoleSchema);
            const TargetRegions = targetConnection.model('Regions', RegionSchema);

            // Clear existing data in the target collections
            await TargetCategories.deleteMany({});
            console.log('Deleted Categories');
            await TargetCategories.insertMany(categoriesData);
            console.log('Inserted Categories');

            await TargetPermissions.deleteMany({});
            console.log('Deleted Permissions');
            await TargetPermissions.insertMany(permissionsData);
            console.log('Inserted Permissions');

            await TargetRoles.deleteMany({});
            console.log('Deleted Roles');
            await TargetRoles.insertMany(rolesData);
            console.log('Inserted Roles');

            await TargetRegions.deleteMany({});
            console.log('Deleted Regions');
            await TargetRegions.insertMany(regionsData);
            console.log('Inserted Regions');

            // Disconnect from the target database
            await targetConnection.close();
            console.log(`*******     Disconnected from ${env} database`);
        }

        // Disconnect from the source database
        await sourceConnection.close();
        console.log('Source database connection closed');

    } catch (err) {
        console.error('Error during data copy:', err);
    }
}

copyData();