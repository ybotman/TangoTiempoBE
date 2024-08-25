const mongoose = require('mongoose');

const userLoginSchema = new mongoose.Schema({
    firebaseUserId: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    organizerInfo: [
        {
            organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizers', required: true }
        }
    ],
    // auditLog: [
    //     {
    //         eventType: { type: String, required: true },
    //         eventTimestamp: { type: Date, required: true, default: Date.now },
    //         ipAddress: { type: String },
    //         platform: { type: String, required: true },
    //         details: { type: String }
    //     }
    // ]
});

const UserLogin = mongoose.model('UserLogin', userLoginSchema);

module.exports = UserLogin;