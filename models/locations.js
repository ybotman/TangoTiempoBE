const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address_1: { type: String, required: true },
  address_2: { type: String },
  address_3: { type: String },
  state: { type: String, required: true },
  city: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, default: "USA" },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  image: { imageUrl: { type: String } },
  geolocation: {
    type: { type: String, default: "Point" }, // GeoJSON type
    coordinates: [Number], // Array to store [longitude, latitude]
  },
  activeFlag: { type: Boolean, default: true }, // New active flag field
  lastUsed: { type: Date }, // New last used date field
  calculatedRegion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Regions",
    required: true,
  }, // New calculated region field
  calculatedDivision: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Divisions",
    required: true,
  }, // New calculated division field
  calculatedCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cities",
    required: true,
  }, // New calculated city field
});

// Creating a 2dsphere index to support geospatial queries
locationSchema.index({ geolocation: "2dsphere" });

const Locations = mongoose.model("Locations", locationSchema);
module.exports = Locations;
