require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' })); // Support larger JSON payloads for progress maps

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leettracker';
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schema
const userProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  progress: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
}, { minimize: false, timestamps: true });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

// Initialize Firebase Admin (Only project ID needed to fetch certificates and verify signatures)
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const isFirebaseSetup = projectId && projectId !== 'your-project-id';

if (isFirebaseSetup) {
  admin.initializeApp({
    projectId: projectId
  });
  console.log(`Firebase Admin initialized for project: ${projectId}`);
} else {
  console.warn('Firebase Admin: VITE_FIREBASE_PROJECT_ID is not configured. Running in Offline/Simulated Auth Mode.');
}

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Pass-through for Offline/Simulated accounts
  if (token.startsWith('offline_') || token === 'guest') {
    req.userId = token;
    return next();
  }

  if (isFirebaseSetup) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.userId = decodedToken.uid;
      next();
    } catch (err) {
      console.error('Firebase Auth Verification Error:', err.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
  } else {
    // If Firebase isn't configured, fall back to treating the token value itself as the userId
    req.userId = token;
    next();
  }
};

// Endpoints
app.get('/api/progress', authMiddleware, async (req, res) => {
  try {
    let userDoc = await UserProgress.findOne({ userId: req.userId });
    if (!userDoc) {
      // Create empty document if it doesn't exist
      userDoc = await UserProgress.create({ userId: req.userId, progress: {} });
    }
    res.json({ progress: userDoc.progress || {} });
  } catch (err) {
    console.error('GET /api/progress error:', err);
    res.status(500).json({ error: 'Failed to retrieve progress from database.' });
  }
});

app.post('/api/progress', authMiddleware, async (req, res) => {
  try {
    const { progress } = req.body;
    if (!progress || typeof progress !== 'object') {
      return res.status(400).json({ error: 'Invalid progress data structure.' });
    }

    const userDoc = await UserProgress.findOneAndUpdate(
      { userId: req.userId },
      { progress: progress },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ progress: userDoc.progress });
  } catch (err) {
    console.error('POST /api/progress error:', err);
    res.status(500).json({ error: 'Failed to save progress to database.' });
  }
});

// Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED' });
});

const path = require('path');

// Serve static assets from Vite's build folder
app.use(express.static(path.join(__dirname, 'dist')));

// Wildcard route to direct all other routes to index.html (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Express server is running on http://localhost:${PORT}`);
});
