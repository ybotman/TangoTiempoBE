const express = require('express');
const router = express.Router();
const Organizers = require('../models/organizers');

// POST: Create a new organizer
router.post('/', async (req, res) => {
    try {
        const organizer = new Organizers(req.body);
        const savedOrganizer = await organizer.save();
        res.status(201).json(savedOrganizer);
    } catch (error) {
        console.error('Error creating organizer:', error);
        res.status(500).json({ message: 'Error creating organizer' });
    }
});


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

// GET: Retrieve all organizers
router.get('/', async (req, res) => {
    try {
        const organizers = await Organizers.find();
        res.status(200).json(organizers);
    } catch (error) {
        console.error('Error retrieving organizers:', error);
        res.status(500).json({ message: 'Error retrieving organizers' });
    }
});

// PUT: Update an existing organizer by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedOrganizer = await Organizers.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedOrganizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }
        res.status(200).json(updatedOrganizer);
    } catch (error) {
        console.error('Error updating organizer:', error);
        res.status(500).json({ message: 'Error updating organizer' });
    }
});

// DELETE: Delete an organizer by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedOrganizer = await Organizers.findByIdAndDelete(req.params.id);
        if (!deletedOrganizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }
        res.status(200).json({ message: 'Organizer deleted' });
    } catch (error) {
        console.error('Error deleting organizer:', error);
        res.status(500).json({ message: 'Error deleting organizer' });
    }
});

module.exports = router;


/* // routes/serverOrganizers.js
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

*/