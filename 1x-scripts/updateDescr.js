const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
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