const mongoose = require('mongoose');

const regionsSchema = new mongoose.Schema({
    regionName: {
        type: String,
        required: true
    },
    regionCode: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Regions', regionsSchema);