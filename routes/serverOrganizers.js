// routes/serverOrganizers.js
const express = require('express');
const router = express.Router();
const Organizers = require('../models/organizers');

// GET organizers by activeCalculatedRegion
router.get('/', async (req, res) => {
    const { activeCalculatedRegion } = req.query;

    try {
        if (!activeCalculatedRegion) {
            return res.status(400).json({ message: 'activeCalculatedRegion is required' });
        }

        const organizers = await Organizers.find({ calculatedRegionName: activeCalculatedRegion });

        res.status(200).json(organizers);
    } catch (error) {
        console.error('Error fetching organizers:', error);
        res.status(500).json({ message: 'Error fetching organizers' });
    }
});

// GET organizer by ID
router.get('/:id', async (req, res) => {
    const organizerId = req.params.id;

    try {
        const organizer = await Organizers.findById(organizerId);
        if (organizer) {
            res.status(200).json(organizer);
        } else {
            res.status(404).json({ message: 'Organizer not found' });
        }
    } catch (error) {
        console.error('Error fetching organizer by ID:', error);
        res.status(500).json({ message: 'Error fetching organizer by ID' });
    }
});


// GET user by Firebase User ID
router.get('/firebase/:firebaseUserId', async (req, res) => {
    const firebaseUserId = req.params.firebaseUserId;

    try {
        const user = await UserLogin.findOne({ firebaseUserId });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user by Firebase User ID:', error);
        res.status(500).json({ message: 'Error fetching user by Firebase User ID' });
    }
});

// GET user by standard _id
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await UserLogin.findById(userId);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ message: 'Error fetching user by ID' });
    }
});

// POST (create) a new user
router.post('/', async (req, res) => {
    const userData = req.body;

    try {
        const newUser = new UserLogin(userData);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// PUT (update) a user by Firebase User ID
router.put('/firebase/:firebaseUserId', async (req, res) => {
    const firebaseUserId = req.params.firebaseUserId;
    const updatedUserData = req.body;

    try {
        const user = await UserLogin.findOneAndUpdate(
            { firebaseUserId },
            updatedUserData,
            { new: true, runValidators: true }
        );
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user by Firebase User ID:', error);
        res.status(500).json({ message: 'Error updating user by Firebase User ID' });
    }
});

// PUT (update) a user by standard _id
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    const updatedUserData = req.body;

    try {
        const user = await UserLogin.findByIdAndUpdate(
            userId,
            updatedUserData,
            { new: true, runValidators: true }
        );
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user by ID:', error);
        res.status(500).json({ message: 'Error updating user by ID' });
    }
});

module.exports = router;

module.exports = router;