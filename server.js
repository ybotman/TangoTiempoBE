require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Events = require('./models/events');
const app = express();
const cors = require('cors');


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

// GET /api/events route to fetch events filtered by region
app.get('/api/events', async (req, res) => {
    const defaultRegion = 'Boston';
    const region = req.query.region || defaultRegion;

    try {
        const events = await Events.find({ region: region });
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



/*********************************  POST *****************************************/

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

/***************************************  listen  **********************/
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

