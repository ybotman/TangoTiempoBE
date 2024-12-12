
// models/Venue.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const venueSchema = new Schema({
  name: { type: String, default: "" },
  shortName: { type: String, default: ""},
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
  masteredCityId: { type: Schema.Types.ObjectId, ref: "masteredCity" },
  masteredDivisionId: { type: Schema.Types.ObjectId, ref: "masteredDivision" },
  masteredRegionId: { type: Schema.Types.ObjectId, ref: "masteredRegion" },
  masteredCountryId: { type: Schema.Types.ObjectId, ref: "masteredCountry" },
  isActive: { type: Boolean, default: false },
});

venueSchema.index({ geolocation: "2dsphere" });

module.exports = mongoose.model("Venue", venueSchema);

