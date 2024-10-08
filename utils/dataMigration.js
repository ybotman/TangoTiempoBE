const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Logger setup with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'migration.log' }),
    new winston.transports.Console()
  ]
});

// Import the schemas
const CategorySchema = require('../models/categories').schema;
const PermissionSchema = require('../models/permissions').schema;
const RoleSchema = require('../models/roles').schema;
const RegionSchema = require('../models/regions').schema;
const EventSchema = require('../models/events').schema;

// Load configuration
const configPath = path.join(__dirname, './dataMigrationConfig.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (err) {
  logger.error('Error loading configuration file:', err);
  process.exit(1);
}

// Define the source and target URIs
const sourceURI = process.env.MONGODB_URI;
const targetURIs = {
  intg: process.env.INTG_DB_URI,
  test: process.env.TEST_DB_URI,
  prod: process.env.PROD_DB_URI,
};

async function copyData() {
  try {
    const sourceConnection = await mongoose.createConnection(sourceURI);
    logger.info('Connected to source database');

    const collections = {
      categories: sourceConnection.model('Categories', CategorySchema),
      permissions: sourceConnection.model('Permission', PermissionSchema),
      roles: sourceConnection.model('Roles', RoleSchema),
      regions: sourceConnection.model('Regions', RegionSchema),
      events: sourceConnection.model('Events', EventSchema)
    };

    // Loop through each environment in the config
    for (const [env, envActive] of Object.entries(config.environments)) {
      if (!envActive) continue;

      const targetURI = targetURIs[env];
      const targetConnection = await mongoose.createConnection(targetURI);
      logger.info(`Connected to ${env} database`);

      for (const [modelName, modelActive] of Object.entries(config.models)) {
        if (!modelActive) continue;

        const sourceCollection = collections[modelName];
        const TargetCollection = targetConnection.model(modelName, sourceCollection.schema);

        // Log and delete existing data
        logger.info(`Deleting existing data in ${modelName} collection`);
        const deleteResult = await TargetCollection.deleteMany({});
        logger.info(`Deleted ${deleteResult.deletedCount} documents in ${modelName}`);

        // Insert new data
        const data = await sourceCollection.find({});
        if (data.length === 0) {
          logger.warn(`No data found in ${modelName} collection`);
          continue;
        }

        await TargetCollection.insertMany(data);
        logger.info(`Inserted ${data.length} documents into ${modelName}`);
      }

      await targetConnection.close();
      logger.info(`Disconnected from ${env} database`);
    }

    await sourceConnection.close();
    logger.info('Source database connection closed');

    // Reset config file
    Object.keys(config.environments).forEach(env => config.environments[env] = false);
    Object.keys(config.models).forEach(model => config.models[model] = false);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    logger.info('Configuration reset to all false after run');

  } catch (err) {
    logger.error('Error during data migration:', err);
  }
}

copyData();