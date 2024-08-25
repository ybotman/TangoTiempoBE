const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env
const Role = require('../models/roles');
const Permission = require('../models/permissions');

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

// Path to the masterdata directory
const masterDataPath = path.join(__dirname, '../masterdata');

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');
        loadRolesFromJSON(); // Call the function to load roles
    })
    .catch(err => {
        console.log('Error connecting to MongoDB:', err);
    });

async function loadRolesFromJSON() {
    try {
        // Load the roles JSON file
        const rolesData = fs.readFileSync(path.join(masterDataPath, 'roles.json'), 'utf-8');
        const roles = JSON.parse(rolesData);

        // Remove all existing roles
        await Role.deleteMany({});
        console.log('All existing roles removed');

        // Insert the new roles directly (permissions are already stored as strings)
        await Role.insertMany(roles);
        console.log('New roles inserted');

        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}