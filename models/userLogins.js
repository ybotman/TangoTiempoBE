const mongoose = require("mongoose");

const notificationPreferencesSchema = new mongoose.Schema({
  new: { type: Boolean, default: false },
  updates: { type: Boolean, default: false },
});

const userCommunicationSettingsSchema = new mongoose.Schema({
  Favorites: {
    festivals: { type: notificationPreferencesSchema, default: {} },
    workshops: { type: notificationPreferencesSchema, default: {} },
    dayWorkshops: { type: notificationPreferencesSchema, default: {} },
    milongas: { type: notificationPreferencesSchema, default: {} },
    practices: { type: notificationPreferencesSchema, default: {} },
    classes: { type: notificationPreferencesSchema, default: {} },
    concerts: { type: notificationPreferencesSchema, default: {} },
  },
  DefaultRegion: {
    festivals: { type: notificationPreferencesSchema, default: {} },
    workshops: { type: notificationPreferencesSchema, default: {} },
    dayWorkshops: { type: notificationPreferencesSchema, default: {} },
    milongas: { type: notificationPreferencesSchema, default: {} },
    practices: { type: notificationPreferencesSchema, default: {} },
    classes: { type: notificationPreferencesSchema, default: {} },
    concerts: { type: notificationPreferencesSchema, default: {} },
  },
  ExternalRegions: {
    festivals: { type: notificationPreferencesSchema, default: {} },
    workshops: { type: notificationPreferencesSchema, default: {} },
    dayWorkshops: { type: notificationPreferencesSchema, default: {} },
    milongas: { type: notificationPreferencesSchema, default: {} },
    practices: { type: notificationPreferencesSchema, default: {} },
    classes: { type: notificationPreferencesSchema, default: {} },
    concerts: { type: notificationPreferencesSchema, default: {} },
  },
});

const userLoginSchema = new mongoose.Schema({
  firebaseUserId: { type: String, required: true, unique: true },
  mfaEnabled: { type: Boolean, default: false },
  roleIds: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Roles" }],
    required: true,
    default: [],
  },
  localUserInfo: {
    loginUserName: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    isEnabled: { type: Boolean, default: true },
    subscribedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Events" }],
    favoriteOrganizers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Organizers" },
    ],
    notificationPreference: {
      type: String,
      enum: ["Application", "Email", "Text"],
      default: "Application",
    },
    photo: { type: String },
    imageSharingLevel: {
      type: String,
      enum: ["none", "friends", "all"],
      default: "none",
    },
    messagePrimaryMethod: {
      type: String,
      enum: ["app", "text", "email", "facebook", "twitter"],
      default: "app",
    },
    userCommunicationSettings: {
      type: userCommunicationSettingsSchema,
      default: {},
    },
  },
  regionalOrganizerInfo: {
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "Organizers" },
    isApporved: { type: Boolean, default: false },
    AoprovdalDate: { type: Date },
    allowedCities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cities" }],
    allowedDivisions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Divisions" },
    ],
    allowedRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Regions" }],
    organizerCommunicationSettingsAdmin: {
      messagePrimaryMethod: {
        type: String,
        enum: ["app", "text", "email", "social"],
        default: "app",
      },
    },
  },
  localAdminInfo: {
    adminRegions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Regions" }],
    adminDivisions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Divisions" },
    ],
    adminCities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cities" }],
    userCommunicationSettings: {
      wantFestivalMessages: { type: Boolean, default: false },
      wantWorkshopMessages: { type: Boolean, default: false },
      messagePrimaryMethod: {
        type: String,
        enum: ["app", "text", "email", "social"],
        default: "app",
      },
    },
  },
  auditLog: [
    {
      eventType: { type: String, required: false, default: "update" },
      eventTimestamp: { type: Date, required: false, default: Date.now },
      ipAddress: { type: String },
      platform: { type: String, required: false },
      details: { type: String },
      previousData: { type: mongoose.Schema.Types.Mixed }, // Store the full previous state here
    },
  ],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to log changes
userLoginSchema.pre("save", async function (next) {
  if (!this.isNew) {
    const previousDoc = await this.constructor.findById(this._id).lean(); // Get the previous state of the document
    if (previousDoc) {
      this.auditLog.push({
        previousData: previousDoc,
        ipAddress: this.ipAddress,
        platform: this.platform,
      });
    }
  }
  this.updatedAt = Date.now();
  next();
});

const UserLogins = mongoose.model("UserLogins", userLoginSchema);

module.exports = UserLogins;
