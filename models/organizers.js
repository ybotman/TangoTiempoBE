const mongoose = require("mongoose");

const organizerSchema = new mongoose.Schema({
  linkedUserLogin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userLogins",
    required: true,
  },
  firebaseUserId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  shortName: { type: String, required: true },
  description: { type: String },
  publicContactInfo: {
    phone: { type: String },
    Email: { type: String },
    url: { type: String },
    address: {
      street1: { type: String },
      street2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
    },
  },
  delegatedOrganizerIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizers",
    },
  ],
  organizerPublicImageURL: { type: String },
  wantRender: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  isEnabled: { type: Boolean, default: false },
  isRendered: { type: Boolean, default: false },
  organizerBannerImage: { type: String, default: "/defaults/banner.png" },
  organizerProfileImage: { type: String, default: "/defaults/profile.png" },
  organizerLandscapeImage: { type: String, default: "/defaults/landscape.png" },
  organizerLogoImage: { type: String, default: "/defaults/logo.png" },

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

  updatedAt: { type: Date, default: Date.now },
  lastEventActivityAsOrganizer: { type: Date, default: Date.now },
  isActiveAsOrganizer: { type: Boolean, default: true },
  btcNiceName: { type: String, required: false },
});

// Middleware to update the `updatedAt` field
organizerSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  this.isActiveAsOrganizer = true;
  next();
});

const Organizers = mongoose.model("Organizers", organizerSchema);
module.exports = Organizers;
