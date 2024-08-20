const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const Categories = require('../models/categories'); // Import the Categories model

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose
    .connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');

        // Insert categories
        return Categories.insertMany([
            { categoryName: "Milonga", categoryCode: "M" },
            { categoryName: "Practica", categoryCode: "P" },
            { categoryName: "Class", categoryCode: "C" },
            { categoryName: "Festival", categoryCode: "F" },
            { categoryName: "Workshop", categoryCode: "W" },
            { categoryName: "Trip", categoryCode: "T" },
            { categoryName: "Virtual", categoryCode: "V" }
        ]);
    })
    .then(() => {
        console.log('Categories inserted');
        return mongoose.disconnect(); // Close the connection after inserting
    })
    .then(() => {
        console.log('MongoDB connection closed');
    })
    .catch(err => {
        console.log('Error:', err);
        mongoose.disconnect(); // Ensure the connection is closed on error
    });