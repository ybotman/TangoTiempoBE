const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    standardsTitle: { type: String, required: false },
    description: { type: String, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    categoryFirst: { type: String, required: true },
    categorySecond: { type: String, required: false },
    categoryThird: { type: String, required: false },
    regionName: { type: String, required: true },
    regionID: { type: mongoose.Schema.Types.ObjectId, ref: 'Regions', required: true },
    ownerOrganizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizers', required: true },
    grantedOrganizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizers', required: false },
    alternateOrganizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizers', required: false },
    ownerOrganizerName: { type: String, required: true },
    calculatedRegionName: { type: String, required: false },
    calculatedDivisionName: { type: String, required: false },
    calculatedCityName: { type: String, required: false },
    eventImage: { type: String, required: false },
    locationID: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    locationName: { type: String, required: false },
    recurrenceRule: { type: String, required: false },
    active: { type: Boolean, required: true, default: true },
    featured: { type: Boolean, required: false, default: false },
    canceled: { type: Boolean, required: false, default: false },
    cost: { type: String, required: false },
    expiresAt: { type: Date, required: true },
    tmpCreator: { type: String, required: false },
    tmpVenueId: { type: String, required: false },
    tmpEventOrgId: { type: String, required: false },
    tmpUrl: { type: String, required: false },
    tmpMix: { type: mongoose.Schema.Types.Mixed, required: false }
});


// Add indexes for performance optimization
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ regionName: 1 });
eventSchema.index({ ownerOrganizerID: 1 });
eventSchema.index({ grantedOrganizerID: 1 });
eventSchema.index({ alternateOrganizerID: 1 });

const Events = mongoose.model('Events', eventSchema);

module.exports = Events;

