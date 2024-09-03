// routes/serverUserLogin.js
const express = require('express');
const router = express.Router();
const UserLogins = require('../models/userLogins');
const getFirebaseUserInfo = require('../utils/firebaseUserInfo');

// GET /api/userlogins/all - Fetch all user logins with roles and organizer info populated
router.get('/all', async (req, res) => {
    try {
        const userLogins = await UserLogins.find()
            .populate({ path: 'localOrganizerInfo.organizerId', select: 'name', strictPopulate: false })
            .exec();
        res.status(200).json(userLogins);
    } catch (error) {
        console.error('Error fetching all user logins:', error);
        res.status(500).json({ message: 'Error fetching user logins' });
    }
});

// GET /api/userlogins/active - Fetch active user logins
router.get('/active', async (req, res) => {
    try {
        const activeUserLogins = await UserLogins.find({ active: true })  // Assuming there's an 'active' field
            .populate('organizerId', 'name');  // Corrected path for population
        res.status(200).json(activeUserLogins);
    } catch (error) {
        console.error('Error fetching active user logins:', error);
        res.status(500).json({ message: 'Error fetching active user logins' });
    }
});

// GET /api/userlogins/firebase/:firebaseId - Fetch user login by Firebase ID
router.get('/firebase/:firebaseId', async (req, res) => {
    const { firebaseId } = req.params;
    try {
        const userLogins = await UserLogins.findOne({ firebaseUserId: firebaseId })
        if (!userLogins) {
            return res.status(404).json({ message: 'User login not found' });
        }
        res.status(200).json(userLogins);
    } catch (error) {
        console.error('Error fetching user login by Firebase ID:', error);
        res.status(500).json({ message: 'Error fetching user login by Firebase ID' });
    }
});



// POST /api/userlogins/ - Create a new user login
router.post('/', async (req, res) => {
    const { firebaseUserId } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await UserLogins.findOne({ firebaseUserId });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user with only the firebaseUserId, relying on schema defaults
        const newUserLogin = new UserLogins({
            firebaseUserId
        });

        // Save the new user login
        await newUserLogin.save();
        res.status(201).json({ message: 'User login created successfully', userLogin: newUserLogin });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



module.exports = router;