const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env

// MongoDB connection URI from .env file
const mongoURI = process.env.MONGODB_URI;

console.log("Connecting to MongoDB...");
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected");
    updateOrganizers(); // Call the function to update organizers
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Organizer model
const Organizers = require("./models/organizers"); // Adjust path as needed

async function updateOrganizers() {
  try {
    const result = await Organizers.updateMany(
      {}, // Match all documents
      {
        $setOnInsert: {
          // Fields and default values to set if missing
          shortName: "Default Short Name",
          btcNiceName: "",
          url: "",
          description: "",
          phone: "",
          publicEmail: "",
          loginId: "",
          activeFlag: true,
          isEnabled: true,
          isRendered: true,
          lastActivity: new Date(),
          paymentTier: "free",
          paidBool: false,
          delegatedOrganizerId: null,
          images: [],
          organizerRegion: null,
          organizerDivision: null,
          organizerCity: null,
        },
      },
      { upsert: false, multi: true },
    );

    console.log(
      `Organizers updated successfully: ${result.nModified} documents modified.`,
    );
  } catch (error) {
    console.error("Error updating organizers:", error);
  } finally {
    mongoose.connection.close(); // Close the connection after the operation
  }
}
