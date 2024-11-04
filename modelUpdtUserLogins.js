const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env

// MongoDB connection URI from .env file
const mongoURI = process.env.MONGODB_URI;

console.log("Connecting to MongoDB...");
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB connected");
    updateUserLogins(); // Call the function to update user logins
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// UserLogins model
const UserLogins = require("./models/userLogins"); // Adjust path as needed

async function updateUserLogins() {
  try {
    // Define the fields that should be retained based on the schema
    const validFields = [
      'firebaseUserId',
      'mfaEnabled',
      'roleIds',
      'localUserInfo',
      'regionalOrganizerInfo',
      'localAdminInfo',
      'auditLog',
      'active',
      'createdAt',
      'updatedAt',
    ];

    // Update and clean documents
    const result = await UserLogins.find({}).lean().exec();
    
    for (const doc of result) {
      const updates = {
        $setOnInsert: {
          mfaEnabled: false,
          roleIds: [],
          localUserInfo: {
            loginUserName: "",
            firstName: "",
            lastName: "",
            isEnabled: true,
            subscribedEvents: [],
            favoriteOrganizers: [],
            notificationPreference: "Application",
            photo: "",
            imageSharingLevel: "none",
            messagePrimaryMethod: "app",
            userCommunicationSettings: {},
          },
          regionalOrganizerInfo: {
            organizerId: '670db15e72b5a57837c8dcd4',
            isApporved: false,
            AoprovdalDate: null,
            allowedCities: [],
            allowedDivisions: [],
            allowedRegions: [],
            organizerCommunicationSettingsAdmin: {
              messagePrimaryMethod: "app",
            },
          },
          localAdminInfo: {
            adminRegions: [],
            adminDivisions: [],
            adminCities: [],
            userCommunicationSettings: {
              wantFestivalMessages: false,
              wantWorkshopMessages: false,
              messagePrimaryMethod: "app",
            },
          },
          auditLog: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      // Unset any fields not in the validFields array
      const unsetFields = Object.keys(doc).reduce((acc, key) => {
        if (!validFields.includes(key) && key !== '_id') { // Exclude '_id'
          acc[key] = ""; // Use "" or null as a placeholder
        }
        return acc;
      }, {});

      if (Object.keys(unsetFields).length > 0) {
        updates.$unset = unsetFields;
      }

      await UserLogins.updateOne({ _id: doc._id }, updates);
    }

    console.log("UserLogins updated and cleaned successfully.");
  } catch (error) {
    console.error("Error updating user logins:", error);
  } finally {
    mongoose.connection.close(); // Close the connection after the operation
  }
}