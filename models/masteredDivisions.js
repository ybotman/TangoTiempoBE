// models/MasteredDivisions.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const masteredDivisionSchema = new Schema({
  divisionName: { type: String, required: true },
  divisionCode: { type: String, required: true },
  active: { type: Boolean, default: true },
  masteredRegionId: {
    type: Schema.Types.ObjectId,
    ref: "MasteredRegion",
    required: true,
  },
  states: { type: [String], required: true },
});

module.exports = mongoose.model("MasteredDivision", masteredDivisionSchema);
