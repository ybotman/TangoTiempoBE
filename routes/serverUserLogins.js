// routes/serverUserLogin.js
const express = require('express');
const router = express.Router();
const UserLogin = require('../models/userLogins');
const getFirebaseUserInfo = require('../utils/firebaseUserInfo');

// GET /api/userlogins/all - Fetch all user logins with roles and organizer info populated
router.get('/all', async (req, res) => {
    try {
        const userLogins = await UserLogin.find()
            .populate({ path: 'localOrganizerInfo.organizerId', select: 'name', strictPopulate: false })
            .exec();
        res.status(200).json(userLogins);
    } catch (error) {
        console.error('Error fetching all user logins:', error);
        res.status(500).json({ message: 'Error fetching user logins' });
    }
});

// GET /api/userlogin/active - Fetch active user logins
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

// GET /api/userlogin/firebase/:firebaseId - Fetch user login by Firebase ID
router.get('/firebase/:firebaseId', async (req, res) => {
    const { firebaseId } = req.params;
    try {
        const userLogins = await UserLogin.findOne({ firebaseUserId: firebaseId })
            .populate('roles', 'roleName')
            .populate('organizerInfo.organizerId', 'name');
        if (!userLogins) {
            return res.status(404).json({ message: 'User login not found' });
        }
        res.status(200).json(userLogins);
    } catch (error) {
        console.error('Error fetching user login by Firebase ID:', error);
        res.status(500).json({ message: 'Error fetching user login by Firebase ID' });
    }
});



// POST /api/userlogin/create - Create a new user login (temporary)
router.post('/create', async (req, res) => {
    const { firebaseUserId, loginUserName, firstName, lastName, roles, organizerInfo } = req.body;

    try {
        const newUserLogin = new UserLogin({
            firebaseUserId,
            namedUserInfo: { loginUserName, firstName, lastName },
            roles,
            organizerInfo
        });

        await newUserLogin.save();
        res.status(201).json(newUserLogin);
    } catch (error) {
        console.error('Error creating user login:', error);
        res.status(500).json({ message: 'Error creating user login' });
    }
});


// PUT /api/userlogin/update/:id - Update a user login by ID
router.put('/update/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        const updatedUserLogin = await UserLogin.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedUserLogin) {
            return res.status(404).json({ message: 'User login not found' });
        }
        res.status(200).json(updatedUserLogin);
    } catch (error) {
        console.error('Error updating user login:', error);
        res.status(500).json({ message: 'Error updating user login' });
    }
});



module.exports = router;