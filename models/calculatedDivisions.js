// models/CalculatedDivision.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const calculatedDivisionSchema = new Schema({
  divisionName: { type: String, required: true },
  divisionCode: { type: String, required: true },
  active: { type: Boolean, default: true },
  calculatedRegionId: {
    type: Schema.Types.ObjectId,
    ref: "CalculatedRegion",
    required: true,
  },
  states: { type: [String], required: true },
});

module.exports = mongoose.model("calculatedDivisions", calculatedDivisionSchema);
