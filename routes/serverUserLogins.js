// routes/serverUserLogin.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Add this line
const UserLogins = require("../models/userLogins");
const Roles = require("../models/roles");
const admin = require("../lib/firebaseAdmin");
const _ = require("lodash"); // Import lodash

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
router.get("/availible", async (req, res) => {
  try {
    const activeUserLogins = await UserLogins.find({
      "localUserInfo.isApproved": true,
      "localUserInfo.isEnabled": true,
    })
      .populate({ path: "localUserInfo.favoriteOrganizers", select: "name" })
      .populate({ path: "roleIds", select: "roleName" })
      .exec();
    console.log("Should we be useing the /availible ?");
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
      })
    );

    res.status(200).json(activeUsersWithFirebaseData);
  } catch (error) {
    console.error("Error fetching active user logins:", error);
    res.status(500).json({ message: "Error fetching active user logins" });
  }
});


<<<<<<< HEAD
// Updated population in GET /api/userlogins/firebase/:firebaseId
=======
// GET /api/userlogins/firebase/:firebaseId - Fetch user login by Firebase ID
>>>>>>> 31d51a1d2a10faa0ae5666c6d655ccaa4504c345
router.get("/firebase/:firebaseId", async (req, res) => {
  const { firebaseId } = req.params;
  try {
    const userLogin = await UserLogins.findOne({
      firebaseUserId: firebaseId,
    })
      .populate({ path: "roleIds", select: "roleName" })
      .populate({
        path: "localUserInfo.subscribedEvents",
        select: "title",
      })
      .populate({
        path: "localUserInfo.favoriteOrganizers",
<<<<<<< HEAD
        select: "fullName name",
=======
        select: "name",
>>>>>>> 31d51a1d2a10faa0ae5666c6d655ccaa4504c345
      });

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

// PUT /api/userlogins/updateUserInfo - Update user info
router.put("/updateUserInfo", async (req, res) => {
  const { firebaseUserId, roleIds, ...otherFields } = req.body;

  try {
    // Fetch the user login document
    const userLogin = await UserLogins.findOne({ firebaseUserId });

    if (!userLogin) {
      return res.status(404).json({ message: "User not found." });
    }

<<<<<<< HEAD
    console.log("UserLogin Document Before Update:", userLogin);
=======
    // Update fields if they are provided in the request
    if (firstName) userLogin.localUserInfo.firstName = firstName;
    if (lastName) userLogin.localUserInfo.lastName = lastName;
    if (userDefaults) userLogin.localUserInfo.userDefaults = userDefaults;
    if (subscribedEvents)
      userLogin.localUserInfo.subscribedEvents = subscribedEvents;
    if (favoriteOrganizers)
      userLogin.localUserInfo.favoriteOrganizers = favoriteOrganizers;
    if (notificationPreference)
      userLogin.localUserInfo.notificationPreference = notificationPreference;
    if (photo) userLogin.localUserInfo.photo = photo;
    if (imageSharingLevel)
      userLogin.localUserInfo.imageSharingLevel = imageSharingLevel;
    if (messagePrimaryMethod)
      userLogin.localUserInfo.messagePrimaryMethod = messagePrimaryMethod;
    if (userCommunicationSettings)
      userLogin.localUserInfo.userCommunicationSettings =
        userCommunicationSettings;
    if (roleIds !== undefined) {
      // Validate if all provided roleIds exist
      const validRoles = await Roles.find({ _id: { $in: roleIds } });
    if (validRoles.length !== roleIds.length) {
        return res.status(400).json({ message: 'Some roleIds are invalid.' });
      }
      userLogin.roleIds = roleIds;
    }

    if (regionalOrganizerInfo !== undefined) {
      userLogin.regionalOrganizerInfo = {
        ...userLogin.regionalOrganizerInfo.toObject(),
        ...regionalOrganizerInfo,
      };
    }
>>>>>>> 31d51a1d2a10faa0ae5666c6d655ccaa4504c345

    // Validate and update roleIds
    if (roleIds !== undefined) {
      const validRoleIds = roleIds.map((roleId) => {
        if (
          typeof roleId === "string" &&
          mongoose.Types.ObjectId.isValid(roleId)
        ) {
          return new mongoose.Types.ObjectId(roleId);
        }
        throw new Error(`Invalid roleId: ${JSON.stringify(roleId)}`);
      });

      const validRoles = await Roles.find({ _id: { $in: validRoleIds } });

      if (validRoles.length !== roleIds.length) {
        return res.status(400).json({ message: "Some roleIds are invalid." });
      }

      // Update user's roles
      userLogin.roleIds = validRoleIds;
    }

    // Merge other fields into userLogin
    if (Object.keys(otherFields).length > 0) {
      _.merge(userLogin, otherFields);
    }

    // Save updated userLogin document
    await userLogin.save();

    res.status(200).json({
      message: "User updated successfully.",
      updatedUser: userLogin,
    });
  } catch (error) {
    console.error("Error updating user info:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
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
