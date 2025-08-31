import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON); // ✅ 從 .env 讀取憑證

const app = express();

app.use((req, res, next) => {
  console.log(`📥 收到請求：${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post('/users', async (req, res) => {
  try {
    const db = admin.firestore();
    const data = {
      name: req.body.name,
      email: req.body.email,
      createdAt: new Date()
    };
    const docRef = await db.collection('users').add(data);
    res.send({ message: 'User added', id: docRef.id });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Firebase Admin SDK 已初始化');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});