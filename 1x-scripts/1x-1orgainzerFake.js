const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');
        insertFakeOrganizer(); // Call the function to insert the fake organizer
    })
    .catch(err => {
        console.log('Error connecting to MongoDB:', err);
    });

const Organizers = require('./models/organizers.js'); // Adjust the path as needed

async function insertFakeOrganizer() {
    try {
        const newOrganizer = new Organizers({
            name: "Boston Tango Club",
            shortName: "BostonTango",
            organzierRegion: new mongoose.Types.ObjectId(), // Corrected instantiation
            regionRole: "Local Organizer",
            url: "https://example.com/boston-tango-club", // Example URL
            description: "Boston Tango Club is the premier organizer of tango events in the Boston area.",
            images: [{ imageUrl: "https://example.com/boston-tango.jpg", imageType: "banner" }],
            phone: "617-555-1234",
            publicEmail: "info@bostontangoclub.com",
            loginId: "bostontango2023", // Example login ID
            activeFlag: true, // Organizer is active
            lastActivity: new Date(), // Set to current date and time
            paymentTier: "basic", // Set payment tier
            paidBool: true // Organizer has paid for services
        });

        await newOrganizer.save();
        console.log("New fake organizer inserted successfully!");
    } catch (error) {
        console.error("Error inserting fake organizer:", error);
    } finally {
        mongoose.connection.close(); // Close the connection after the operation
    }
}