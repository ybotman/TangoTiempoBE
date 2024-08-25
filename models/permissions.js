const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    permissionName: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String,
        required: true
    },
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
permissionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Permission = mongoose.model('Permission', permissionSchema);
module.exports = Permission;