const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const CalculatedCountry = require("../../models/calculatedCountries");

// Ensure this matches your .env file
const mongoURI = process.env.MONGODB_URI;

// Predefined list of countries with continent attributes
const countries = [
  { countryName: "United States", countryCode: "US", continent: "North America" },
  { countryName: "Canada", countryCode: "CA", continent: "North America" },
  { countryName: "Australia", countryCode: "AU", continent: "Australia" },
  { countryName: "New Zealand", countryCode: "NZ", continent: "Australia" },
  { countryName: "Brazil", countryCode: "BR", continent: "South America" },
  { countryName: "Argentina", countryCode: "AR", continent: "South America" },
  { countryName: "Germany", countryCode: "DE", continent: "Europe" },
  { countryName: "France", countryCode: "FR", continent: "Europe" },
  { countryName: "United Kingdom", countryCode: "UK", continent: "Europe" },
  { countryName: "Italy", countryCode: "IT", continent: "Europe" },
  { countryName: "Spain", countryCode: "ES", continent: "Europe" },
  // Add more countries as needed
];

console.log("Connecting to MongoDB...");
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected");
    loadCountries();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

async function loadCountries() {
  try {
    // Remove all existing countries
    await CalculatedCountry.deleteMany({});
    console.log("All existing countries removed");

    // Insert the new countries
    await CalculatedCountry.insertMany(countries);
    console.log("New countries inserted");

    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error loading countries:", error);
  }
}