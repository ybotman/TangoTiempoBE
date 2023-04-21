const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Event = require('./models/events');
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, (error) => {
    if (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    } else {
        console.log('MongoDB connected...');
    }
});

// Middleware for parsing JSON request bodies
app.use(bodyParser.json());

// Define API routes here

// GET /api/events route to fetch events filtered by region
app.get('/api/events', async (req, res) => {
    const defaultRegion = 'boston';
    const region = req.query.region || defaultRegion;

    try {
        const events = await Events.find({ region: region });
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
