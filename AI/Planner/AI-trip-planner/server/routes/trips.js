import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';
import Trip from '../models/Trip.js'; // ✅ ADD THIS - Import Trip model
import generateItinerary from '../utils/hfPlanner.js';

const router = express.Router();

// ✅ NEW: Generate AI Itinerary Route
router.post("/generate-itinerary", async (req, res) => {
  try {
    const { destination, numberOfDays, preferences, origin, startDate, endDate } = req.body;

    if (!destination || !numberOfDays) {
      return res.status(400).json({ error: "Destination and number of days are required" });
    }

    // Generate itinerary using your HuggingFace planner
    const itinerary = await generateItinerary({
      destination,
      numberOfDays,
      preferences: preferences || [],
      origin,
      startDate,
      endDate
    });

    res.json({ itinerary });
  } catch (err) {
    console.error("Error generating itinerary:", err.message);
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

// ✅ NEW: Save Trip Route
router.post("/", async (req, res) => {
  try {
    const tripData = req.body;
    const userId = req.user.id; // From authenticateToken middleware

    const newTrip = new Trip({
      ...tripData,
      userId
    });

    await newTrip.save();
    res.status(201).json({ message: "Trip saved successfully", trip: newTrip });
  } catch (err) {
    console.error("Error saving trip:", err.message);
    res.status(500).json({ error: "Failed to save trip" });
  }
});

// ✅ NEW: Get all trips for user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const trips = await Trip.find({ userId }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    console.error("Error fetching trips:", err.message);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

// ✅ EXISTING: Chatbot POST route using HuggingFace AI
router.post("/chatbot", async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Generate response using the itinerary function
    const botReply = await generateItinerary({ 
      destination: message, 
      numberOfDays: 3, 
      preferences: [] 
    });

    // Save chat history
    let chat = await Chat.findOne({ userId });
    if (!chat) chat = new Chat({ userId, messages: [] });

    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "bot", content: botReply });
    await chat.save();

    res.json({ reply: botReply });
  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.status(500).json({ error: "Something went wrong with the chatbot." });
  }
});

// ✅ EXISTING: Chat history route
router.get("/chatbot/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const chat = await Chat.findOne({ userId });
    res.json({ messages: chat ? chat.messages : [] });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Something went wrong fetching chat history." });
  }
});

export default router;