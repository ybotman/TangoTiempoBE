const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    standardsTitle: { type: String, required: false },
    eventDescription: { type: String, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    categoryFirst: { type: String, required: true },
    categorySecond: { type: String, required: false },
    categoryThird: { type: String, required: false },
    region: { type: String, required: true },
    ownerOrganizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventOrganizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    altOrganizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    eventImage: { type: String, required: false },
    locationID: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: false },
    recurrenceRule: { type: String, required: false },
    active: { type: Boolean, required: true },
    featured: { type: Boolean, required: false },
    cost: { type: String, required: false },
    region: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});

const Events = mongoose.model('Events', eventSchema);

module.exports = Events;