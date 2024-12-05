// models/CalculatedRegion.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const calculatedRegionSchema = new Schema({
  regionName: { type: String, required: true },
  regionCode: { type: String, required: true },
  active: { type: Boolean, default: true },
  calculatedCountryId: {
    type: Schema.Types.ObjectId,
    ref: "CalculatedCountry",
    required: true,
  },
});

module.exports = mongoose.model("calculatedRegion", calculatedRegionSchema);
