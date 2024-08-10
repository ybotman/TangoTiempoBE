const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    organizerName: { type: String, required: true },
    organizerShortName: { type: String, required: true },
    region: { type: mongoose.Schema.Types.ObjectId, ref: 'Regions', required: true }, // Linking to the Regions collection
    regionRole: { type: String, required: true }, // Role within the region (e.g., Organizer, RegionalAdmin)
    url: { type: String }, // Organizer's website URL
    description: { type: String }, // Organizer's description
    images: [{
        imageUrl: { type: String },
        imageType: { type: String } // Type of image (e.g., logo, banner)
    }],
    phone: { type: String }, // Contact phone number
    publicEmail: { type: String }, // Public-facing email
    loginId: { type: String }, // Link to Firebase auth ID or other authentication ID
    activeFlag: { type: Boolean, required: true, default: true }, // Whether the organizer is active
    lastActivity: { type: Date, default: Date.now }, // Last activity timestamp
    paymentTier: {
        type: String,
        enum: ['free', 'basic', 'premium'], // Payment tier options
        required: true,
        default: 'free'
    }, // Payment tier for advertising
    paidBool: { type: Boolean, default: false } // Whether the organizer has paid for services
});

const Organizers = mongoose.model('Organizers', organizerSchema);
module.exports = Organizers;


/* old 
const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    organizerName: { type: String, required: true },
    organizerShortName: { type: String, required: true },
    region: { type: String, required: true },
    activeBool: { type: Boolean, required: true },
    paidBool: { type: Boolean, required: true }
});

const Organizers = mongoose.model('Organizers', organizerSchema);
module.exports = Organizers;
*/