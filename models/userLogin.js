const mongoose = require('mongoose');

const userLoginSchema = new mongoose.Schema({
    firebaseUserId: { type: String, required: true, unique: true },
    authType: { type: String, required: true },  // e.g., 'Google', 'Facebook'
    mfaEnabled: { type: Boolean, default: false },
    namedUserInfo: {
        loginUserName: { type: String, required: true },
        firstName: { type: String },
        lastName: { type: String },
        icon: { type: String }
    },
    organizerInfo: [
        {
            organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizers', required: true }
        }
    ],
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }], // Link to Role model
    auditLog: [
        {
            eventType: { type: String, required: true },
            eventTimestamp: { type: Date, required: true, default: Date.now },
            ipAddress: { type: String },
            platform: { type: String, required: true },
            details: { type: String }
        }
    ]
});
