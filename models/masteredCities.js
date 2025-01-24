// models/MasteredCities.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const masteredCitySchema = new Schema({
  cityName: { type: String, required: true },
  cityCode: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  location: {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function (value) {
          return value.length === 2;
        },
        message:
          "Coordinates must have exactly 2 elements: [longitude, latitude]",
      },
    },
  },
  isActive: { type: Boolean, default: true },
  masteredDivisionId: {
    type: Schema.Types.ObjectId,
    ref: "MasteredDivision",
    required: true,
  },
});

// Create a 2dsphere index on the location field
masteredCitySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("masteredCity", masteredCitySchema);
