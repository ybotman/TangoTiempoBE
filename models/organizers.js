const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
    organizerName: { type: String, required: true },
    organizerShortName: { type: String, required: true },
    region: { type: String, required: true },
    activeBool: { type: Boolean, required: true },
    paidBool: { type: Boolean, required: true }
});

const Organizers = mongoose.model('Organizers', organizerSchema);
module.exports = Organizers;
