/*
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
                title: "Tango2 Extravaganza",
                standardsTitle: "Tang2o Extravaganza",
                eventDescription: "An amazing tango event.",
                startDate: new Date("2024-10-15T20:00:00.000Z"),
                endDate: new Date("2024-10-15T23:00:00.000Z"),
                categoryFirst: "Milonga",
                ownerOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be35"),
                altOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventImage: "https://example.com/image.jpg",
                locationID: new mongoose.Types.ObjectId("6449ee6895174c52123afd4c"),
                active: true,
                featured: false,
                cost: "Free",
                expiresAt: new Date("2026-09-16T00:00:00.000Z")
            },
            {
                title: "Tango Class Night2",
                standardsTitle: "TangoClass Nigh2t",
                eventDescription: "A night full of tango.",
                startDate: new Date("2024-10-01T20:00:00.000Z"),
                endDate: new Date("2024-10-01T23:00:00.000Z"),
                categoryFirst: "Class",
                ownerOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be35"),
                altOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be37"),
                eventImage: "https://example.com/image2.jpg",
                locationID: new mongoose.Types.ObjectId("6449ee6895174c52123afd4c"),
                active: true,
                featured: false,
                cost: "10 USD",
                expiresAt: new Date("2025-08-02T00:00:00.000Z")
            },
            {
                title: "Tango2 Workshop",
                standardsTitle: "Tango2 Workshop",
                eventDescription: "A workshop to improve your tango skills.",
                startDate: new Date("2024-10-03T18:00:00.000Z"),
                endDate: new Date("2024-10-03T21:00:00.000Z"),
                categoryFirst: "Workshop",
                categorySecond: "Class",
                categoryThird: "Milonga",
                ownerOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be35"),
                altOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventImage: "https://example.com/image3.jpg",
                locationID: new mongoose.Types.ObjectId("6449ee6895174c52123afd4c"),
                recurrenceRule: "",
                active: true,
                featured: true,
                cost: "20 USD",
                expiresAt: new Date("2025-08-06T00:00:00.000Z")
            },
            {
                title: "LeTango Festival",
                standardsTitle: "LETango Festival",
                eventDescription: "Le grand festival celebrating tango.",
                startDate: new Date("2024-11-1T19:00:00.000Z"),
                endDate: new Date("2024-11-3T22:00:00.000Z"),
                categoryFirst: "Festival",
                categorySecond: "Milonga",
                categoryThird: "Class",
                ownerOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be35"),
                altOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventImage: "https://example.com/image4.jpg",
                locationID: new mongoose.Types.ObjectId("6449ee6895174c52123afd4c"),
                recurrenceRule: "",
                active: true,
                featured: true,
                cost: "50 USD",
                expiresAt: new Date("2025-08-11T00:00:00.000Z")
            },
            {
                title: "Tango Practice2",
                standardsTitle: "Tango Practice2",
                eventDescription: "Practice your tango moves.",
                startDate: new Date("2024-10-15T20:00:00.000Z"),
                endDate: new Date("2024-10-15T23:00:00.000Z"),
                categoryFirst: "Practica",
                categorySecond: "Milonga",
                categoryThird: "Class",
                ownerOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be35"),
                altOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventImage: "https://example.com/image5.jpg",
                locationID: new mongoose.Types.ObjectId("6449ee6895174c52123afd4c"),
                active: true,
                featured: false,
                cost: "5 USD",
                expiresAt: new Date("2025-08-16T00:00:00.000Z")
            },
            {
                title: "Tango Deay Out",
                standardsTitle: "Tango Deay Out",
                eventDescription: "A night out with tango music and dancing.",
                startDate: new Date("2024-10-12T20:00:00.000Z"),
                endDate: new Date("2024-10-12T23:00:00.000Z"),
                categoryFirst: "Practica",
                categorySecond: "Festival",
                categoryThird: "Practica",
                ownerOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be35"),
                altOrganizerID: new mongoose.Types.ObjectId("6442ccb5f88a6c48aa30be36"),
                eventImage: "https://example.com/image6.jpg",
                locationID: new mongoose.Types.ObjectId("6449ee6895174c52123afd4c"),
                active: true,
                featured: true,
                cost: "15 USD",
                expiresAt: new Date("2025-08-21T00:00:00.000Z")
            }
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

*/


const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        updateEvents();
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

// Function to update events
const updateEvents = async () => {
    try {
        console.log('Updating events...');
        const result = await Event.updateMany(
            { recurrenceRule: { $exists: true } },
            { $set: { recurrenceRule: null } }
        );
        console.log('Events updated successfully', result);
    } catch (error) {
        console.error('Error updating events:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};
