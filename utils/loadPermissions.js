const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env
const Permission = require('../models/permissions'); // Adjust the path based on your project structure

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

// Path to the masterdata directory
const masterDataPath = path.join(__dirname, '../masterdata');

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');
        loadPermissionsFromJSON(); // Call the function to load permissions
    })
    .catch(err => {
        console.log('Error connecting to MongoDB:', err);
    });
/*
async function loadPermissionsFromJSON() {
    try {
        // Load the JSON file from the masterdata directory
        const permissionsData = fs.readFileSync(path.join(masterDataPath, 'permissions.json'), 'utf-8');
        const permissions = JSON.parse(permissionsData);

        // Remove all existing permissions
        await Permission.deleteMany({});
        console.log('All existing permissions removed');

        // Insert the new permissions
        await Permission.insertMany(permissions);
        console.log('New permissions inserted');

        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error loading permissions:', error);
    }
}

*/
