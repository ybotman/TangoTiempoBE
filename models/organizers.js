const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    btcNiceName:{type: String, required: false},
    organizerRegion: { type: mongoose.Schema.Types.ObjectId, ref: 'Regions', required: true },
    organizerDivision: { type: mongoose.Schema.Types.ObjectId, ref: 'Divisions', required: true },
    organizerCity: { type: mongoose.Schema.Types.ObjectId, ref: 'Cities', required: true },
    firebaseUserId: { type: String, required: true, unique: true },
    url: { type: String },
    description: { type: String },
    images: [{ imageUrl: { type: String }, imageType: { type: String } }],
    phone: { type: String },
    publicEmail: { type: String },
    loginId: { type: String },
    activeFlag: { type: Boolean, required: true, default: true },
    updatedAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }, // Last activity timestamp
    paymentTier: {
        type: String,
        enum: ['free', 'basic', 'premium'], // Payment tier options
        required: true,
        default: 'free'
    }, // Payment tier for advertising
    paidBool: { type: Boolean, default: false } // Whether the organizer has paid for services
});

// Middleware to update the `updatedAt` field
organizerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});


const Organizers = mongoose.model('Organizers', organizerSchema);
module.exports = Organizers;
