const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
    regionName: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('Region', RegionSchema);
