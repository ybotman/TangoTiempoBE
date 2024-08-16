const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define the schema for organizers
const organizerSchema = new mongoose.Schema({
    organizerName: { type: String, required: true },
    organizerShortName: { type: String, required: true },
    region: { type: mongoose.Schema.Types.ObjectId, ref: 'Regions', required: true },
    regionRole: { type: String, required: true, default: 'Organizer' },
    url: { type: String, default: '' },
    description: { type: String, default: '' },
    images: [{
        imageUrl: { type: String, default: '' },
        imageType: { type: String, default: 'logo' }
    }],
    phone: { type: String, default: '' },
    publicEmail: { type: String, default: '' },
    loginId: { type: String, default: '' },
    activeFlag: { type: Boolean, required: true, default: true },
    lastActivity: { type: Date, default: Date.now },
    paymentTier: { type: String, enum: ['free', 'basic', 'premium'], required: true, default: 'free' },
    paidBool: { type: Boolean, default: false }
});

const Organizers = mongoose.model('Organizers', organizerSchema);
const Regions = mongoose.model('Regions', new mongoose.Schema({ regionName: String, regionCode: String }));

// Function to update existing organizers
const updateOrganizers = async () => {
    try {
        // Fetch the region ObjectId for 'Boston'
        const bostonRegion = await Regions.findOne({ regionName: 'Boston' });

        if (!bostonRegion) {
            throw new Error('Region Boston not found');
        }

        // Fetch all organizers
        const organizers = await Organizers.find();

        for (const organizer of organizers) {
            organizer.region = bostonRegion._id;  // Assign the ObjectId of the region
            organizer.organizerShortName = organizer.organizerName.split(' ')[0];  // Use part of organizerName as short name
            organizer.activeFlag = organizer.activeBool !== undefined ? organizer.activeBool : true;  // Set activeFlag
            organizer.url = '';  // Default to empty string
            organizer.description = '';  // Default to empty string
            organizer.images = [{ imageUrl: '', imageType: 'logo' }];  // Default image placeholder
            organizer.phone = '';  // Default to empty string
            organizer.publicEmail = '';  // Default to empty string
            organizer.loginId = '';  // Default to empty string
            organizer.lastActivity = new Date();  // Set to current date/time
            organizer.paymentTier = 'free';  // Default to 'free'
            organizer.paidBool = organizer.paidBool || false; // Keep the current value or default to false

            // Save the updated organizer document
            await organizer.save();
            console.log(`Updated organizer with ID: ${organizer._id}`);
        }

        console.log('All organizers updated successfully');
    } catch (error) {
        console.error('Error updating organizers:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

updateOrganizers();