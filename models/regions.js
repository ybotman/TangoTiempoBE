const mongoose = require("mongoose");

const regionsSchema = new mongoose.Schema({
  regionName: { type: String, required: true },
  regionCode: { type: String, required: true },
  active: { type: Boolean, default: true },
  divisions: [
    {
      divisionName: { type: String, required: true },
      divisionCode: { type: String, required: true },
      active: { type: Boolean, default: true },
      states: { type: [String], required: true },
      majorCities: [
        {
          cityName: { type: String, required: true },
          cityCode: { type: String, required: true },
          latitude: { type: Number, required: true },
          longitude: { type: Number, required: true },
          active: { type: Boolean, default: true },
          location: {
            type: {
              type: String,
              enum: ["Point"], // Ensure the type is always "Point" for GeoJSON
              required: true,
              default: "Point",
            },
            coordinates: {
              type: [Number], // Format: [longitude, latitude]
              required: true,
              validate: {
                validator: function (value) {
                  return value.length === 2; // Ensure the coordinates array has exactly 2 elements
                },
                message:
                  "Coordinates must have exactly 2 elements: [longitude, latitude]",
              },
            },
          },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Regions", regionsSchema);
