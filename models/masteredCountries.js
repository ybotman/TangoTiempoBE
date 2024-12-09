// models/MasteredCountry.js
const mongoose = require("mongoose");
const { Schema } = mongoose;
const masteredCountrySchema = new mongoose.Schema({
  countryName: { type: String, required: true },
  countryCode: { type: String, required: true },
  continent: { type: String, required: true }, // New attribute
  active: { type: Boolean, default: true },
});

module.exports = mongoose.model("masteredCountry", masteredCountrySchema);
