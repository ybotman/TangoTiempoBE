const mongoose = require('mongoose');

const userLoginSchema = new mongoose.Schema({
    firebaseUserId: { type: String, required: true, unique: true },
    mfaEnabled: { type: Boolean, default: false },
    roleIds: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Roles' }],
        required: true,
        default: []
    },
    localUserInfo: {
        loginUserName: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        icon: { type: String },
        defaultedCity: { type: mongoose.Schema.Types.ObjectId, ref: 'Cities' },
        favoriteOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organizers' }],
        favoriteLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Locations' }],
        userCommunicationSettings: {
            wantFestivalMessages: { type: Boolean, default: false },
            wantWorkshopMessages: { type: Boolean, default: false },
            messagePrimaryMethod: { type: String, enum: ['app', 'text', 'email', 'social'], default: 'app' }
        }
    },
    localOrganizerInfo: {
        organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizers' },
        allowedCities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cities' }],
        allowedDivisions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Divisions' }],
        allowedRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Regions' }],
        organizerCommunicationSettings: {
            messagePrimaryMethod: { type: String, enum: ['app', 'text', 'email', 'social'], default: 'app' }
        }
    },
    localAdminInfo: {
        adminRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Regions' }],
        adminDivisions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Divisions' }],
        adminCities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cities' }],
        userCommunicationSettings: {
            wantFestivalMessages: { type: Boolean, default: false },
            wantWorkshopMessages: { type: Boolean, default: false },
            messagePrimaryMethod: { type: String, enum: ['app', 'text', 'email', 'social'], default: 'app' }
        }
    },
    auditLog: [
        {
            eventType: { type: String, required: false, default: 'update' },
            eventTimestamp: { type: Date, required: false, default: Date.now },
            ipAddress: { type: String },
            platform: { type: String, required: false },
            details: { type: String },
            previousData: { type: mongoose.Schema.Types.Mixed } // Store the full previous state here
        }
    ],
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to log changes
userLoginSchema.pre('save', async function (next) {
    if (!this.isNew) { // If it's not a new document
        const previousDoc = await this.constructor.findById(this._id).lean(); // Get the previous state of the document
        if (previousDoc) {
            this.auditLog.push({
                previousData: previousDoc,
                ipAddress: this.ipAddress, // Assuming you set these in the request context
                platform: this.platform
            });
        }
    }
    this.updatedAt = Date.now();
    next();
});

const UserLogins = mongoose.model('UserLogins', userLoginSchema);

module.exports = UserLogins;