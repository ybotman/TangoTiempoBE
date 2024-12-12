// models/MasteredRegion.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const masteredRegionSchema = new Schema({
  regionName: { type: String, required: true },
  regionCode: { type: String, required: true },
  active: { type: Boolean, default: true },
  masteredCountryId: {
    type: Schema.Types.ObjectId,
    ref: "MasteredCountry",
    required: true,
  },
});

module.exports = mongoose.model("MasteredRegion", masteredRegionSchema);
