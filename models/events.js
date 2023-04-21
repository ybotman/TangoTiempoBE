const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    standardsTitle: { type: String, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    category: { type: String, required: true },
    category_alternate: { type: String, required: false },
    region: { type: String, required: true },
    ownerOrganizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventOrganizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
});

eventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Events = mongoose.model('Events', eventSchema);

module.exports = Events;
