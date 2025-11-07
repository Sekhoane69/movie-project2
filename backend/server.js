// server.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
// ========================== FIREBASE ADMIN INIT ========================== //
let serviceAccount;
try {
  // Prefer local key if available (for local dev)
  serviceAccount = require('./serviceAccountKey.json');
  console.log('✅ Using local Firebase service account file');
} catch (error) {
  // Use environment variables on Render
  console.log('⚙️ Using Firebase credentials from environment variables');
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY || '{}');
}

if (!serviceAccount.project_id || !serviceAccount.private_key) {
  console.error('❌ Missing Firebase credentials. Check FIREBASE_KEY in Render.');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// Middleware
app.use(cors());
app.use(express.json());

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://manlike-ecb0c.web.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// ========================== ROUTES ========================== //

// ✅ Get all reviews for a specific movie
app.get('/api/reviews/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const reviewsRef = db.collection('reviews').where('movieId', '==', movieId);
    const snapshot = await reviewsRef.get();

    const reviews = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    // Manual sort (newest first)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`Found ${reviews.length} reviews for movie ${movieId}`);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.json([]); // Return empty array instead of error
  }
});

// ✅ Get all reviews by a specific user
app.get('/api/reviews/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const reviewsRef = db.collection('reviews').where('username', '==', username);
    const snapshot = await reviewsRef.get();

    const reviews = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    // Manual sort (newest first)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// ✅ Create a new review
app.post('/api/reviews', async (req, res) => {
  try {
    const { movieId, movieTitle, rating, review, username } = req.body;

    // Validation
    if (!movieId || !movieTitle || !rating || !review || !username) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const now = new Date();

    const reviewData = {
      movieId,
      movieTitle,
      rating: parseInt(rating),
      review,
      username,
      createdAt: admin.firestore.FieldValue.serverTimestamp() || now,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() || now
    };

    const docRef = await db.collection('reviews').add(reviewData);
    
    res.status(201).json({
      id: docRef.id,
      ...reviewData,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// ✅ Update a review
app.put('/api/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;

    if (!rating || !review) {
      return res.status(400).json({ error: 'Rating and review are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const reviewRef = db.collection('reviews').doc(reviewId);
    const doc = await reviewRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await reviewRef.update({
      rating: parseInt(rating),
      review,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const updatedDoc = await reviewRef.get();
    res.json({ id: reviewId, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// ✅ Delete a review
app.delete('/api/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const reviewRef = db.collection('reviews').doc(reviewId);
    const doc = await reviewRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await reviewRef.delete();
    res.json({ message: 'Review deleted successfully', id: reviewId });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ✅ Get all reviews (for My Reviews page)
app.get('/api/reviews', async (req, res) => {
  try {
    const reviewsRef = db.collection('reviews');
    const snapshot = await reviewsRef.get();

    const reviews = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    // Sort newest first
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Failed to fetch all reviews' });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT,"0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
