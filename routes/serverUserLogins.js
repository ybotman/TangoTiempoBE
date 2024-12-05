// routes/serverUserLogin.js
const express = require("express");
const router = express.Router();
const UserLogins = require("../models/userLogins");
const Roles = require("../models/roles");
const admin = require("../lib/firebaseAdmin");
const rateLimiter = require("../middleware/rateLimiter");
const logger = require("../utils/logger");
const mongoose = require("mongoose");
// Apply rate limiter to all routes in this router
router.use(rateLimiter);

// Logging middleware for POST, PUT, DELETE
router.use((req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    logger.info(
      `UserLogins ${req.method} request, URL: ${req.originalUrl}, Body: ${JSON.stringify(req.body)}, IP: ${req.ip}`,
    );
  }
  next();
});

// GET /api/userlogins/all - Fetch all user logins with roles and organizer info populated
router.get("/all", async (req, res) => {
  try {
    const userLogins = await UserLogins.find()
      .populate({
        path: "regionalOrganizerInfo.organizerId",
        select: "name",
        strictPopulate: false,
      })
      .populate({ path: "roleIds", select: "roleName" })
      .exec();

    // Fetch Firebase user info for each user login
    const userLoginsWithFirebaseData = await Promise.all(
      userLogins.map(async (userLogin) => {
        const firebaseUserInfo = await admin
          .auth()
          .getUser(userLogin.firebaseUserId);
        return {
          ...userLogin.toObject(),
          firebaseUserInfo: {
            displayName: firebaseUserInfo.displayName,
            email: firebaseUserInfo.email,
          },
        };
      }),
    );

    res.status(200).json(userLoginsWithFirebaseData);
  } catch (error) {
    console.error("Error fetching all user logins:", error);
    res.status(500).json({ message: "Error fetching user logins" });
  }
});

// GET /api/userlogins/active - Fetch active user logins
router.get("/active", async (req, res) => {
  try {
    const activeUserLogins = await UserLogins.find({ active: true })
      .populate({ path: "organizerId", select: "name" })
      .populate({ path: "roleIds", select: "roleName" })
      .exec();

    // Fetch Firebase user info for each active user login
    const activeUsersWithFirebaseData = await Promise.all(
      activeUserLogins.map(async (userLogin) => {
        const firebaseUserInfo = await admin
          .auth()
          .getUser(userLogin.firebaseUserId);
        return {
          ...userLogin.toObject(),
          firebaseUserInfo: {
            displayName: firebaseUserInfo.displayName,
            email: firebaseUserInfo.email,
          },
        };
      }),
    );

    res.status(200).json(activeUsersWithFirebaseData);
  } catch (error) {
    console.error("Error fetching active user logins:", error);
    res.status(500).json({ message: "Error fetching active user logins" });
  }
});

// GET /api/userlogins/firebase/:firebaseId - Fetch user login by Firebase ID
router.get("/firebase/:firebaseId", async (req, res) => {
  const { firebaseId } = req.params;
  try {
    const userLogin = await UserLogins.findOne({
      firebaseUserId: firebaseId,
    }).populate({ path: "roleIds", select: "roleName" });

    if (!userLogin) {
      return res.status(404).json({ message: "User login not found" });
    }

    // Fetch Firebase user info
    const firebaseUserInfo = await admin.auth().getUser(firebaseId);

    res.status(200).json({
      ...userLogin.toObject(),
      firebaseUserInfo: {
        displayName: firebaseUserInfo.displayName,
        email: firebaseUserInfo.email,
      },
    });
  } catch (error) {
    console.error("Error fetching user login by Firebase ID:", error);
    res
      .status(500)
      .json({ message: "Error fetching user login by Firebase ID" });
  }
});

// POST /api/userlogins/ - Create a new user login
router.post("/", async (req, res) => {
  const { firebaseUserId } = req.body;

  // Log the login attempt
  logger.info(
    `New User for Firebase User ID: ${firebaseUserId}, IP: ${req.ip}`,
  );

  try {
    // Check if the user already exists
    const existingUser = await UserLogins.findOne({ firebaseUserId });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Find the roleId of the role with the name 'NamedUser'
    const namedUserRole = await Roles.findOne({ roleName: "NamedUser" });
    if (!namedUserRole) {
      return res
        .status(500)
        .json({ message: "Could not create user due to server error" });
    }

    // Create a new user with firebaseUserId and assign the NamedUser role
    const newUserLogin = new UserLogins({
      firebaseUserId,
      roleIds: [namedUserRole._id], // Assign the role ID of 'NamedUser'
    });

    // Save the new user login
    await newUserLogin.save();
    res.status(204).json({ message: "User login created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// PUT /api/userlogins/updateUserInfo - Update user info
router.put("/updateUserInfo", async (req, res) => {
  const {
    firebaseUserId,
    firstName,
    lastName,
    userDefaults,
    subscribedEvents,
    favoriteOrganizers,
    notificationPreference,
    photo,
    imageSharingLevel,
    messagePrimaryMethod,
    userCommunicationSettings,
    regionalOrganizerInfo, // Include regionalOrganizerInfo
    roleIds, // Include roleIds if needed
  } = req.body;

  try {
    const userLogin = await UserLogins.findOne({ firebaseUserId });
    if (!userLogin) {
      return res.status(404).json({ message: "User not found" });
    }

    if (regionalOrganizerInfo !== undefined) {
      // Merge existing regionalOrganizerInfo with the new data
      userLogin.regionalOrganizerInfo = {
        ...userLogin.regionalOrganizerInfo.toObject(),
        ...regionalOrganizerInfo,
      };
    }

    if (roleIds !== undefined) {
      userLogin.roleIds = roleIds.map((role) =>
        mongoose.Types.ObjectId.isValid(role)
          ? new mongoose.Types.ObjectId(role)
          : new mongoose.Types.ObjectId(role._id),
      );
    }

    await userLogin.save();

    // Populate roleIds
    await userLogin.populate("roleIds");

    res.status(200).json({
      message: "User info updated successfully.",
      updatedUser: userLogin,
    });
  } catch (error) {
    console.error("Error updating user info:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// PUT /api/userlogins/:firebaseId/roles - Update the roles of a user
router.put("/:firebaseId/roles", async (req, res) => {
  const { firebaseId } = req.params;
  const { roleIds } = req.body;

  try {
    // Check if at least one role is provided
    if (!roleIds || roleIds.length < 1) {
      return res
        .status(400)
        .json({ message: "At least one role must be assigned to the user." });
    }

    // Validate if all provided roleIds exist
    const validRoles = await Roles.find({ _id: { $in: roleIds } });
    if (validRoles.length !== roleIds.length) {
      return res.status(400).json({ message: "Some roleIds are invalid." });
    }

    // Find the user by firebaseUserId
    const userLogin = await UserLogins.findOne({ firebaseUserId: firebaseId });
    if (!userLogin) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update user's roles
    userLogin.roleIds = roleIds;
    await userLogin.save();

    res.status(200).json({
      message: "User roles updated successfully.",
      updatedRoles: roleIds,
    });
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({ message: "Server error.", error });
  }
});

module.exports = router;
