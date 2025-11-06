const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  let credential;
  try {
    const serviceAccount = require("../serviceAccountKey.json");
    credential = admin.credential.cert(serviceAccount);
  } catch (error) {
    console.log("Using environment variables for Firebase credentials");
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    });
  }

  admin.initializeApp({ credential });
}

const db = admin.firestore();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// === Routes ===

// Get all reviews for a specific movie
app.get("/api/reviews/:movieId", async (req, res) => {
  try {
    const snapshot = await db.collection("reviews")
      .where("movieId", "==", req.params.movieId)
      .orderBy("createdAt", "desc")
      .get();
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString()
    }));
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get all reviews by user
app.get("/api/reviews/user/:username", async (req, res) => {
  try {
    const snapshot = await db.collection("reviews")
      .where("username", "==", req.params.username)
      .orderBy("createdAt", "desc")
      .get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
});

// Create review
app.post("/api/reviews", async (req, res) => {
  try {
    const { movieId, movieTitle, rating, review, username } = req.body;
    if (!movieId || !movieTitle || !rating || !review || !username)
      return res.status(400).json({ error: "All fields required" });

    const data = {
      movieId,
      movieTitle,
      rating: parseInt(rating),
      review,
      username,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const doc = await db.collection("reviews").add(data);
    res.status(201).json({ id: doc.id, ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Delete review
app.delete("/api/reviews/:reviewId", async (req, res) => {
  try {
    const ref = db.collection("reviews").doc(req.params.reviewId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Review not found" });
    await ref.delete();
    res.json({ message: "Review deleted", id: req.params.reviewId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Export the API
exports.api = functions.https.onRequest(app);
