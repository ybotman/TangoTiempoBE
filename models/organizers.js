const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    organzierRegion: { type: mongoose.Schema.Types.ObjectId, ref: 'Regions', required: true },
    regionRole: { type: String, required: true },
    url: { type: String },
    description: { type: String },
    images: [{ imageUrl: { type: String }, imageType: { type: String } }],
    phone: { type: String },
    publicEmail: { type: String },
    loginId: { type: String },
    activeFlag: { type: Boolean, required: true, default: true },
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