const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  standardsTitle: { type: String, required: false },
  shortTitle: { type: String, required: false },
  description: { type: String, required: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  categoryFirst: { type: String, required: false },
  categorySecond: { type: String, required: false },
  categoryThird: { type: String, required: false },
  regionName: { type: String, required: true },
  ownerOrganizerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizers",
    required: true,
  },
  grantedOrganizerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizers",
    required: false,
  },
  alternateOrganizerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizers",
    required: false,
  },
  ownerOrganizerName: { type: String, required: true },
  masteredRegionName: { type: String, required: false },
  masteredDivisionName: { type: String, required: false },
  masteredCityName: { type: String, required: false },
  eventImage: { type: String, required: false },
  bannerImage: { type: String, required: false },
  featuredImage: { type: String, required: false },
  seriesImages: [{ type: String, required: false }],
  venueID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Venue",
    required: false,
  },
  venueGeolocation: {
    type: { type: String, default: "Point", enum: ["Point"] },
    coordinates: { type: [Number] },
  },
  recurrenceRule: { type: String, required: false },
  isDiscovered: { type: Boolean, required: true, default: true },
  isOwnerManaged: { type: Boolean, required: true, default: true },
  isActive: { type: Boolean, required: true, default: true },
  isFeatured: { type: Boolean, required: false, default: false },
  isCanceled: { type: Boolean, required: false, default: false },
  discoveredLastDate: { type: Date, required: false },
  discoveredFirstDate: { type: Date, required: false },
  discoveredComments: { type: String, required: false },
  cost: { type: String, required: false },
  expiresAt: { type: Date, required: true },
});

// Add indexes for performance optimization
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ regionName: 1 });
eventSchema.index({ ownerOrganizerID: 1 });
eventSchema.index({ grantedOrganizerID: 1 });
eventSchema.index({ alternateOrganizerID: 1 });

const Events = mongoose.model("Events", eventSchema);

module.exports = Events;
