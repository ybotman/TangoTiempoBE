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
// Define the Event schema
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
    region: { type: String, default: "BOS" }  // Add the region field with a default value of "BOS"
});

// Create the Event model
const Event = mongoose.model('Event', eventSchema);

// Update existing events to add the region field
async function updateEventsWithRegion() {
    try {
        await Event.updateMany(
            { region: { $exists: false } }, // Only update documents that don't have the region field
            { $set: { region: "BOS" } }     // Set the region field to "BOS" by default
        );
        console.log('Events updated with region field.');
    } catch (err) {
        console.error('Error updating events:', err);
    } finally {
        mongoose.connection.close();
    }
}

updateEventsWithRegion();