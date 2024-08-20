const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');

mongoose
    .connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');

        // Create the view using the MongoDB command
        return mongoose.connection.db.createCollection("activeDivisions", {
            viewOn: "Regions",
            pipeline: [
                { $unwind: "$divisions" },
                { $match: { "divisions.active": true } },
                {
                    $project: {
                        _id: 0,
                        regionName: 1,
                        regionCode: 1,
                        divisionName: "$divisions.divisionName",
                        states: "$divisions.states",
                        majorCities: "$divisions.majorCities"
                    }
                }
            ]
        });
    })
    .then(() => {
        console.log('View "ActiveDivisions" created successfully');
        return mongoose.disconnect(); // Close the connection after creating the view
    })
    .then(() => {
        console.log('MongoDB connection closed');
    })
    .catch(err => {
        console.error('Error:', err);
        mongoose.disconnect(); // Ensure the connection is closed on error
    });