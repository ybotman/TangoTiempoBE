const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
    regionName: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Region', regionSchema);