const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    roleName: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    permissions: [{
        type: String,
        ref: 'Permission'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the `updatedAt` field
roleSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Roles = mongoose.model('Roles', roleSchema);
module.exports = Roles;