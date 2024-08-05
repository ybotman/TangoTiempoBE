const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    location_name: { type: String, required: true },
    address_1: { type: String, required: true },
    address_2: { type: String },
    state: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true }
});

const Locations = mongoose.model('Locations', locationSchema);
module.exports = Locations;