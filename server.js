// checkpoint to see it pushing to github (prep to pull into azure)
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const connectDB = require('./db');


const Events = require('./models/events');
const Categories = require('./models/categories');
const Organizers = require('./models/organizers');
const Regions = require('./models/regions');
const Locations = require('./models/locations');


// Connect to MongoDB  I had to do this once, and it worked sbut removed bc mongoos.connect.,.
//connectDB();


// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected...'))
    .catch((err) => console.log(`MongoDB connection error: ${err}`));


// Middleware for parsing JSON request bodies
app.use(bodyParser.json());
app.use(cors());


// Define API routes here
/************************************   GET ******************************/

// GET /api/events route to fetch all events
app.get('/api/events', async (req, res) => {
    try {
        const events = await Events.find();
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

app.get('/api/events/:id', async (req, res) => {
    const eventId = req.params.id;

    try {
        const event = await Events.findById(eventId);
        if (event) {
            res.status(200).json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        res.status(500).json({ message: 'Error fetching event by ID' });
    }
});

app.get('/api/organizers', async (req, res) => {
    try {
        const organizers = await Organizers.find();

        res.status(200).json(organizers);
    } catch (error) {
        console.error('Error fetching organizers:', error);
        res.status(500).json({ message: 'Error fetching organizers' });
    }
});

app.get('/api/organizers/:id', async (req, res) => {
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

// GET /api/events/owner/:ownerId route to fetch events by ownerOrganizer
app.get('/api/events/owner/:ownerId', async (req, res) => {
    const ownerId = req.params.ownerId;

    try {
        const eventsByOwner = await Events.find({ ownerOrganizer: ownerId });
        res.status(200).json(eventsByOwner);
    } catch (error) {
        console.error('Error fetching events by ownerOrganizer:', error);
        res.status(500).json({ message: 'Error fetching events by ownerOrganizer' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Categories.find();

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

app.get('/api/regions', async (req, res) => {
    try {
        const regions = await Regions.find();
        res.status(200).json(regions);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ message: 'Error fetching regions' });
    }
});

// GET /api/locations route to fetch all locations
app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Locations.find();
        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations' });
    }
});

// GET /api/locations/:id route to fetch a location by ID
app.get('/api/locations/:id', async (req, res) => {
    const locationId = req.params.id;

    try {
        const location = await Locations.findById(locationId);
        if (location) {
            res.status(200).json(location);
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        console.error('Error fetching location by ID:', error);
        res.status(500).json({ message: 'Error fetching location by ID' });
    }
});

/*********************************  POST *****************************************/

// POST /api/locations route to create a new location
app.post('/api/locations', async (req, res) => {
    const locationData = req.body;

    try {
        const newLocation = new Locations(locationData);
        await newLocation.save();
        res.status(201).json(newLocation);
    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({ message: 'Error creating location' });
    }
});

// POST /api/events route to create a new event
app.post('/api/events', async (req, res) => {
    const eventData = req.body;

    try {
        const newEvent = new Events(eventData);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
});


/*********************************  PUT *****************************************/


// PUT /api/events/:eventId route to update an existing event
app.put('/api/events/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    const updatedEventData = req.body;

    try {
        const eventToUpdate = await Events.findById(eventId);
        if (!eventToUpdate) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        Object.assign(eventToUpdate, updatedEventData);
        await eventToUpdate.save();
        res.status(200).json(eventToUpdate);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event' });
    }
});


// PUT /api/locations/:id route to update an existing location
app.put('/api/locations/:id', async (req, res) => {
    const locationId = req.params.id;
    const updatedLocationData = req.body;

    try {
        const locationToUpdate = await Locations.findById(locationId);
        if (!locationToUpdate) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }

        Object.assign(locationToUpdate, updatedLocationData);
        await locationToUpdate.save();
        res.status(200).json(locationToUpdate);
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Error updating location' });
    }
});

/***************************************  listen  **********************/
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

