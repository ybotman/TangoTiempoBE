const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config(); // Load environment variables from .env

const Regions = require("./models/Regions"); // Import the Regions model

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

console.log("Connecting to MongoDB...");
mongoose
  .connect(mongoURI) // Removed deprecated options
  .then(() => {
    console.log("MongoDB connected");

    // Read the JSON data from the file
    const data = fs.readFileSync(
      "./masterdata/fullerRegDevCitActive.json",
      "utf-8",
    );
    const jsonData = JSON.parse(data);

    // Iterate over each region in the JSON data
    const operations = jsonData.regions.map((region) => {
      return Regions.updateOne(
        { regionCode: region.regionCode }, // Match region by regionCode
        {
          $set: {
            regionName: region.regionName,
            active: region.active,
            divisions: region.divisions,
          },
        },
        { upsert: true }, // Insert the document if it doesn't exist
      )
        .then((result) => {
          if (result.upserted) {
            console.log(
              `Inserted new region: ${region.regionName} (${region.regionCode})`,
            );
          } else if (result.nModified > 0) {
            console.log(
              `Updated existing region: ${region.regionName} (${region.regionCode})`,
            );
          } else {
            console.log(
              `No changes made to region: ${region.regionName} (${region.regionCode})`,
            );
          }
        })
        .catch((err) => {
          console.error(
            `Error processing region: ${region.regionName} (${region.regionCode})`,
            err,
          );
        });
    });

    // Execute all update operations in parallel
    return Promise.all(operations);
  })
  .then(() => {
    console.log("Regions updated or inserted successfully");
    return mongoose.disconnect(); // Close the connection after processing
  })
  .then(() => {
    console.log("MongoDB connection closed");
  })
  .catch((err) => {
    console.error("Error:", err);
    mongoose.disconnect(); // Ensure the connection is closed on error
  });
