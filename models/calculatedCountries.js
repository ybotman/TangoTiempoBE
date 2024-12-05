// models/CalculatedCountry.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const calculatedCountrySchema = new mongoose.Schema({
  countryName: { type: String, required: true },
  countryCode: { type: String, required: true },
  continent: { type: String, required: true }, // New attribute
  active: { type: Boolean, default: true },
});


module.exports = mongoose.model('CalculatedCountry', calculatedCountrySchema);