// src/lib/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service.json'); // Replace with your Firebase service account JSON file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
