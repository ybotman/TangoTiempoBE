
console.log('mongoose...');
const mongoose = require('mongoose');

console.log('require(dotenv).config();...');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        insertEvents();
    })
    .catch(err => {
        console.log('Error connecting to MongoDB:', err);
    });

// Define the schema for events
const eventSchema = new mongoose.Schema({
    title: String,
    standardsTitle: String,
    eventDescription: String,
    startDate: Date,
    endDate: Date,
    categoryFirst: String,
    categorySecond: String,
    categoryThird: String,
    ownerOrganizerID: mongoose.Schema.Types.ObjectId,
    eventOrganizerID: mongoose.Schema.Types.ObjectId,
    altOrganizerID: mongoose.Schema.Types.ObjectId,
    eventImage: String,
    locationID: mongoose.Schema.Types.ObjectId,
    recurrenceRule: String,
    active: Boolean,
    featured: Boolean,
    cost: String,
    expiresAt: Date
});

// Create the model
const Event = mongoose.model('Event', eventSchema);

// Function to insert new events
const insertEvents = async () => {
    try {
        console.log('Inserting events...');
        // Insert new events
        const newEvents = [
            {
                title: "Tango Extravaganza",
                standardsTitle: "Tango Extravaganza",
                eventDescription: "An amazing tango event.",
                startDate: new Date("2024-09-15T20:00:00.000Z"),
                endDate: new Date("2024-09-15T23:00:00.000Z"),
                categoryFirst: "Milonga",
                categorySecond: "Practica",
                categoryThird: "Workshop",
                ownerOrganizerID: mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventOrganizerID: mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be35"),
                altOrganizerID: mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be37"),
                eventImage: "https://example.com/image.jpg",
                locationID: mongoose.Types.ObjectId("6449ee6895174c52123afd4c"),
                recurrenceRule: "FREQ=WEEKLY;BYDAY=MO",
                active: true,
                featured: false,
                cost: "Free",
                expiresAt: new Date("2026-09-16T00:00:00.000Z")
            },
            // Add more events as needed
        ];

        for (const newEvent of newEvents) {
            const event = new Event(newEvent);
            await event.save();
            console.log(`Inserted event with ID: ${event._id}`);
        }

        console.log('Events inserted successfully');
    } catch (error) {
        console.error('Error inserting events:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};