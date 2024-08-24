// routes/serverCategories.js
const express = require('express');
const router = express.Router();
const Categories = require('../models/categories');

// GET all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Categories.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

module.exports = router;