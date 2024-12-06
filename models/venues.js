
// models/Venue.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const venueSchema = new Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  address1: { type: String, default: "" },
  address2: { type: String, default: "" },
  address3: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  zip: { type: String, default: "" },
  phone: { type: String, default: "" },
  comments: { type: String, default: "" },
  latitude: { type: Number },
  longitude: { type: Number },
  geolocation: {
    type: { type: String, default: "Point", enum: ["Point"] },
    coordinates: { type: [Number] },
  },
  calculatedCityId: { type: Schema.Types.ObjectId, ref: "calculatedCity" },
  calculatedDivisionId: { type: Schema.Types.ObjectId, ref: "calculatedDivision" },
  calculatedRegionId: { type: Schema.Types.ObjectId, ref: "calculatedRegion" },
  calculatedCountryId: { type: Schema.Types.ObjectId, ref: "calculatedCountry" },
  active: { type: Boolean, default: false },
});

venueSchema.index({ geolocation: "2dsphere" });

module.exports = mongoose.model("Venue", venueSchema);

