const admin = require('firebase-admin');
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const { setGlobalOptions } = require("firebase-functions");
const functions = require('firebase-functions');
const { nextApp } = require('./ssr'); // ← 匯入 SSR handler

setGlobalOptions({ maxInstances: 10 });

// ✅ Next.js SSR handler
exports.nextApp = nextApp;

// ✅ Firestore API handler
exports.addStudent = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const { name, grade } = req.body;

  try {
    const docRef = await db.collection('students').add({ name, grade });
    res.status(200).send(`Student added with ID: ${docRef.id}`);
  } catch (error) {
    res.status(500).send(`Error adding student: ${error.message}`);
  }
});
