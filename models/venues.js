//models/venues.js
// models/Venue.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const venueSchema = new Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  address1: { type: String, required: true, default:"address"  },
  address2: { type: String },
  address3: { type: String },
  city: { type: String, required: false },
  zip: { type: String, required: false },
  phone: { type: String, required: false },
  comments: { type: String, required: false },
  latitude: { type: Number, required: false },
  longitude: { type: Number, required: false },
  geolocation: {
    type: { type: String, default: "Point", enum: ["Point"] },
    coordinates: { type: [Number], required: false }, // [lng, lat]
  },
  calculatedCityId: {
    type: Schema.Types.ObjectId,
    ref: "calculatedCity",
    required: false,
  },
  calculatedDivisionId: {
    type: Schema.Types.ObjectId,
    ref: "calculatedDivision",
    required: false,
  },
  calculatedRegionId: {
    type: Schema.Types.ObjectId,
    ref: "calculatedRegion",
    required: false,
  },
  calculatedCountryId: {
    type: Schema.Types.ObjectId,
    ref: "calculatedCountry",
    required: false,
  },
  active: { type: Boolean, default: true },
});

// Index for geospatial queries
venueSchema.index({ geolocation: "2dsphere" });

module.exports = mongoose.model("Venue", venueSchema);
