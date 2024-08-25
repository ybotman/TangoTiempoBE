const connectDB = require('../db');
const Events = require('../models/events');

// Replace the example values with your own
const testEvents = [
    {
        title: 'Test Event 1',
        startDate: new Date('2023-05-01T10:00:00'),
        endDate: new Date('2023-05-01T12:00:00'),
        category: 'Practica',
        region: 'Boston',
        ownerOrganizer: '60a63c232fcd683cb4d9f27e', // Example ObjectId - replace with a valid ObjectId
        eventOrganizer: '60a63c232fcd683cb4d9f27e', // Example ObjectId - replace with a valid ObjectId
        expiresAt: new Date('2023-11-01T12:00:00'),
    },
    {
        title: 'Test Event 2',
        startDate: new Date('2023-04-12T14:00:00'),
        endDate: new Date('2023-04-12T16:00:00'),
        category: 'Practica',
        region: 'Boston',
        ownerOrganizer: '60a63c232fcd683cb4d9f27f', // Example ObjectId - replace with a valid ObjectId
        eventOrganizer: '60a63c232fcd683cb4d9f27e', // Example ObjectId - replace with a valid ObjectId
        expiresAt: new Date('2023-11-02T16:00:00'),
    },
    {
        title: 'Test Event 2',
        startDate: new Date('2023-05-03T14:00:00'),
        endDate: new Date('2023-05-03T16:00:00'),
        category: 'Milonga',
        region: 'Boston',
        ownerOrganizer: '60a63c232fcd683cb4d9f27f', // Example ObjectId - replace with a valid ObjectId
        eventOrganizer: '60a63c232fcd683cb4d9f27e', // Example ObjectId - replace with a valid ObjectId
        expiresAt: new Date('2023-11-02T16:00:00'),
    }, {
        title: 'Test Event 2',
        startDate: new Date('2023-05-02T14:00:00'),
        endDate: new Date('2023-05-02T16:00:00'),
        category: 'Milonga',
        region: 'Boston',
        ownerOrganizer: '60a63c232fcd683cb4d9f27f', // Example ObjectId - replace with a valid ObjectId
        eventOrganizer: '60a63c232fcd683cb4d9f27e', // Example ObjectId - replace with a valid ObjectId
        expiresAt: new Date('2023-11-02T16:00:00'),
    }, {
        title: 'Test Event 2',
        startDate: new Date('2023-04-22T00:00:00'),
        endDate: new Date('2023-05-25T00:00:00'),
        category: 'Festival',
        region: 'Boston',
        ownerOrganizer: '60a63c232fcd683cb4d9f27f', // Example ObjectId - replace with a valid ObjectId
        eventOrganizer: '60a63c232fcd683cb4d9f27e', // Example ObjectId - replace with a valid ObjectId
        expiresAt: new Date('2023-11-02T16:00:00'),
    },
];

const seedEventsToDatabase = async () => {
    await connectDB();

    try {
        await Events.insertMany(testEvents);
        console.log('Test events added successfully');
        process.exit();
    } catch (error) {
        console.error('Error adding test events:', error);
        process.exit(1);
    }
};

seedEventsToDatabase();
