const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');
        insertEventsFromAPI();
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
    expiresAt: Date,
    region: String
});

// Create the model
const Event = mongoose.model('Event', eventSchema);

// Organizer IDs to alternate between
const organizerIDs = [
    new mongoose.Types.ObjectId('6442ccb5f88a6c48aa30be36'),
    new mongoose.Types.ObjectId('6442ccb5f88a6c48aa30be35')
];

let organizerIndex = 0;

// Function to insert events from API
const insertEventsFromAPI = async () => {
    try {
        console.log('Fetching events from API...');
        const response = await axios.get('https://bostontangocalendar.com/wp-json/tribe/events/v1/events');
        const events = response.data.events;

        console.log('Inserting events...');
        for (const eventData of events) {
            const event = new Event({
                title: eventData.title,
                standardsTitle: eventData.title, // Assuming standardsTitle is similar to title
                eventDescription: eventData.description,
                startDate: new Date(eventData.utc_start_date),
                endDate: new Date(eventData.utc_end_date),
                categoryFirst: eventData.categories[0]?.name || '',
                categorySecond: eventData.categories[1]?.name || '',
                categoryThird: eventData.categories[2]?.name || '',
                ownerOrganizerID: organizerIDs[organizerIndex % organizerIDs.length],
                eventOrganizerID: organizerIDs[organizerIndex % organizerIDs.length],
                altOrganizerID: organizerIDs[(organizerIndex + 1) % organizerIDs.length],
                eventImage: eventData.image?.url || '',
                locationID: new mongoose.Types.ObjectId('6449ee6895174c52123afd4c'), // Assuming locationID is fixed
                recurrenceRule: eventData.recurrence || '',
                active: true,
                featured: eventData.featured || false,
                cost: eventData.cost || 'Free',
                expiresAt: new Date('2026-09-16T00:00:00.000Z'), // Assuming a default expiry
                region: 'Boston'
            });

            organizerIndex++;
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