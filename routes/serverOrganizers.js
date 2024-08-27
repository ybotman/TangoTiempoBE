// routes/serverOrganizers.js
const express = require('express');
const router = express.Router();
const Organizers = require('../models/organizers');


// GET all organizers (no filters)
router.get('/all', async (req, res) => {
    try {
        const organizers = await Organizers.find({});
        res.status(200).json(organizers);
    } catch (error) {
        console.error('Error fetching all organizers:', error);
        res.status(500).json({ message: 'Error fetching all organizers' });
    }
});


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


// POST create a new organizer
router.post('/', async (req, res) => {
    const { name, shortName, organizerRegion, organizerDivision, organizerCity, regionRole, url, description, phone, publicEmail, loginId, paymentTier } = req.body;

    try {
        const newOrganizer = new Organizers({
            name,
            shortName,
            organizerRegion,
            organizerDivision,
            organizerCity,
            regionRole,
            url,
            description,
            phone,
            publicEmail,
            loginId,
            paymentTier,
            activeFlag: true,  // Defaulting new organizers to active
            lastActivity: Date.now(),
            paidBool: false  // Defaulting new organizers to unpaid
        });

        const savedOrganizer = await newOrganizer.save();

        res.status(201).json(savedOrganizer);
    } catch (error) {
        console.error('Error creating new organizer:', error);
        res.status(500).json({ message: 'Error creating new organizer' });
    }
});

module.exports = router;