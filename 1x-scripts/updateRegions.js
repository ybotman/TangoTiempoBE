const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define the new schema for the new collection
const newRegionSchema = new mongoose.Schema({
    regionName: String,
    regionCode: String
}, { collection: 'regions' });

const NewRegion = mongoose.model('NewRegion', newRegionSchema);

// Predefined region data
const regionData = [
    { regionName: "Los Angeles", regionCode: "LA" },
    { regionName: "Boston", regionCode: "BOS" },
    { regionName: "Denver", regionCode: "DEN" },
    { regionName: "New York City", regionCode: "NYC" }
];

// Function to insert regions
const insertRegions = async () => {
    try {
        for (const region of regionData) {
            const newRegion = new NewRegion({
                regionName: region.regionName,
                regionCode: region.regionCode
            });

            // Save the new region document
            await newRegion.save();
            console.log(`Inserted region: ${region.regionName} with code: ${region.regionCode}`);
        }

        console.log('Regions inserted successfully');
    } catch (error) {
        console.error('Error inserting regions:', error);
    } finally {
        mongoose.connection.close();
    }
};

insertRegions();