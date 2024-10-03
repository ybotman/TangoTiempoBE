const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected');
        insertEvent(); // Call the function to insert the event
    })
    .catch(err => {
        console.log('Error connecting to MongoDB:', err);
    });

const Events = require('./models/events'); // Adjust the path as needed

async function insertEvent() {
    try {
        const newEvent = new Events({
            title: "2nd Tango Event",
            standardsTitle: "2nd Tango Milonga Night", // Example standard title
            description: "Join us for an exciting evening of tango with live music, dancing, and great company.", // Example description
            startDate: new Date().setHours(01, 30, 0), // 
            endDate: new Date().setHours(03, 30, 0), // 
            categoryFirst: 'Milonga',
            locationID: new mongoose.Types.ObjectId("66c8bc4c6b597390419b9187"), // Provided Location ID
            locationName: "Fake Tango Venue", // Provided Location Name
            regionID: new mongoose.Types.ObjectId("66c4d99042ec462ea22484bd"), // Provided Region ID
            regionName: "Northeast", // Provided Region Name
            calculatedRegionName: "Northeast",
            calculatedDivisionName: "New England",
            calculatedCityName: "Boston",
            active: true, // Assuming the event is active
            featured: false, // Not featured by default
            ownerOrganizerID: new mongoose.Types.ObjectId("66c8bd338593d5136d3fdf0b"), // Provided Organizer ID
            ownerOrganizerName: "Boston Tango Club", // Provided Organizer Name
            expiresAt: new Date().setHours(23, 59, 59) // Event expires at the end of the day
        });

        await newEvent.save();
        console.log("New event inserted successfully!");
    } catch (error) {
        console.error("Error inserting event:", error);
    } finally {
        mongoose.connection.close(); // Close the connection after the operation
    }
}