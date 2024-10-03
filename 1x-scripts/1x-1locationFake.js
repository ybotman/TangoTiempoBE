const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');
        insertFakeLocation(); // Call the function to insert the fake location
    })
    .catch(err => {
        console.log('Error connecting to MongoDB:', err);
    });

const Locations = require('./models/locations.js'); // Adjust the path as needed

async function insertFakeLocation() {
    try {
        const newLocation = new Locations({
            name: "Fake Tango Venue",
            address_1: "123 Tango St.",
            address_2: "Suite 456",
            address_3: null, // Optional
            state: "MA", // Massachusetts
            city: "Boston",
            zip: "02118",
            country: "USA",
            latitude: 42.3601,
            longitude: -71.0589,
            image: { imageUrl: "https://example.com/fake-tango-venue.jpg" }, // Example image URL
            geolocation: {
                type: "Point",
                coordinates: [-71.0589, 42.3601], // [longitude, latitude]
            }
        });

        await newLocation.save();
        console.log("New fake location inserted successfully!");
    } catch (error) {
        console.error("Error inserting fake location:", error);
    } finally {
        mongoose.connection.close(); // Close the connection after the operation
    }
}