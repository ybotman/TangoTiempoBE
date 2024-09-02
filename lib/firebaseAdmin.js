const admin = require('firebase-admin');

// Base64 decode the environment variable and parse it as JSON
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_JSON, 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
