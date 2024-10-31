const mongoose = require("mongoose");

const organizerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  btcNiceName: { type: String, required: false },
  organizerRegion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Regions",
    required: true,
  },
  organizerDivision: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Divisions",
    required: false,
  },
  organizerCity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cities",
    required: false,
  },
  firebaseUserId: { type: String, required: true, unique: true },
  url: { type: String },
  description: { type: String },
  images: [
    {
      originalUrl: { type: String }, // Azure Blob URL for original image
      thumbnailUrl: { type: String }, // Resized URL for thumbnail
      mediumUrl: { type: String }, // Resized URL for medium size
      largeUrl: { type: String }, // Resized URL for large size
      imageType: {
        type: String,
        enum: ["thumbnail", "banner", "profile", "event"],
      }, // Image purpose
      tags: [{ type: String }], // Tags for categorizing images
      uploadDate: { type: Date, default: Date.now }, // Date image was uploaded
      fileSize: { type: Number }, // Image file size in bytes
      resolution: { width: Number, height: Number }, // Image width and height
      isApproved: { type: Boolean, default: true }, // Approval status for user-uploaded images
      isExternal: { type: Boolean, default: false }, // External image source flag
      externalSource: { type: String }, // Source URL if `isExternal` is true
      orientation: { type: String, enum: ["landscape", "portrait", "square"] }, // Image orientation
      isMobileFriendly: { type: Boolean, default: true }, // Flag for mobile suitability
    },
  ],
  phone: { type: String },
  publicEmail: { type: String },
  loginId: { type: String },
  activeFlag: { type: Boolean, required: true, default: true },
  updatedAt: { type: Date, default: Date.now },
  isEnabled: { type: Boolean, default: true }, // Active status
  isRendered: { type: Boolean, default: true }, // Rendered status
  lastActivity: { type: Date, default: Date.now }, // Last activity timestamp
  paymentTier: {
    type: String,
    enum: ["free", "basic", "premium"], // Payment tier options
    required: true,
    default: "free",
  }, // Payment tier for advertising
  paidBool: { type: Boolean, default: false }, // Whether the organizer has paid for services

  // Delegated organizer for shared management access
  delegatedOrganizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizers", // References the Organizers collection
    default: null,
  },
});

// Middleware to update the `updatedAt` field
organizerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Organizers = mongoose.model("Organizers", organizerSchema);
module.exports = Organizers;
