const mongoose = require('mongoose');

const regionsSchema = new mongoose.Schema({
    regionName: { type: String, required: true },
    regionCode: { type: String, required: true },
    active: { type: Boolean, default: true },
    divisions: [
        {
            divisionName: { type: String, required: true },
            active: { type: Boolean, default: true },
            states: { type: [String], required: true },
            majorCities: [
                {
                    cityName: { type: String, required: true },
                    latitude: { type: Number, required: true },
                    longitude: { type: Number, required: true },
                    active: { type: Boolean, default: true }
                }
            ]
        }
    ]
});

module.exports = mongoose.model('Regions', regionsSchema);