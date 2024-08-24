const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config(); // Load environment variables from .env

const Regions = require('../models/Regions'); // Import the Regions model

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose
    .connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');

        // Read the JSON data from the file
        const data = fs.readFileSync('./utils/master/RegDivCitActive.js', 'utf-8');
        const jsonData = JSON.parse(data);

        // Insert regions from the JSON data
        return Regions.insertMany(jsonData.regions);
    })
    .then(() => {
        console.log('Regions inserted successfully');
        return mongoose.disconnect(); // Close the connection after inserting
    })
    .then(() => {
        console.log('MongoDB connection closed');
    })
    .catch(err => {
        console.error('Error:', err);
        mongoose.disconnect(); // Ensure the connection is closed on error
    });