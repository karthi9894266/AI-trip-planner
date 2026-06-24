import 'dotenv/config';

// ⭐️ START: CRITICAL API KEY CHECK ⭐️
if (!process.env.HF_API_KEY) {
    console.error("==================================================================");
    console.error("❌ FATAL ERROR: Hugging Face API Key is missing from environment.");
    console.error("     Please check your .env file for the correct HF_API_KEY.");
    console.error("==================================================================");
    process.exit(1);
}
// ⭐️ END: CRITICAL API KEY CHECK ⭐️

import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import cors from "cors";

// ✅ Import Google Auth configuration BEFORE using passport
import './config/googleAuth.js';

// --- CORRECTED PATHS ASSUMING MIDDLEWARE AND MODELS ARE INSIDE THE SERVER DIRECTORY ---
import authenticateToken from "./middleware/authMiddleware.js";
import Chat from "./models/Chat.js";

// --- IMPORT ALL ROUTERS SAFELY ---
const flightsModule = await import('./routes/flights.js');
const flightsRouter = flightsModule.default || flightsModule;

const hotelsModule = await import('./routes/hotels.js');
const hotelsRouter = hotelsModule.default || hotelsModule;

const authModule = await import('./routes/auth.js');
const authRoutes = authModule.default || authModule;

const tripsModule = await import('./routes/trips.js');
const tripRoutes = tripsModule.default || tripsModule;

const itineraryModule = await import('./routes/itinerary.js');
const itineraryRouter = itineraryModule.default || itineraryModule;

const chatModule = await import('./routes/chat.js');
const chatRouter = chatModule.default || chatModule;

// 🔍 DEBUG: Check imported routers
console.log('🔍 Checking imported routers:');
console.log('  - flightsRouter:', typeof flightsRouter);
console.log('  - hotelsRouter:', typeof hotelsRouter);
console.log('  - authRoutes:', typeof authRoutes);
console.log('  - tripRoutes:', typeof tripRoutes);
console.log('  - itineraryRouter:', typeof itineraryRouter);
console.log('  - chatRouter:', typeof chatRouter);

// --- END ROUTER IMPORTS ---

const app = express();

// ✅ Serve static files
app.use(express.static("public"));

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ai-trip-planner-sooty-three.vercel.app"
    ],
    credentials: true,
  })
);

// ✅ CRITICAL FIX: Add URL-encoded parser for query parameters
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ← ADD THIS LINE!

// ✅ Initialize passport (AFTER importing googleAuth.js)
app.use(passport.initialize());

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ✅ API routes - MOUNTING ALL CONVERTED ROUTERS
console.log('📋 Mounting routes...');

app.use("/api/flights", flightsRouter);
console.log('  ✅ Mounted: /api/flights');

app.use("/api/hotels", hotelsRouter);
console.log('  ✅ Mounted: /api/hotels');

app.use("/api/auth", authRoutes);
console.log('  ✅ Mounted: /api/auth');

app.use("/api/trips", authenticateToken, tripRoutes);
console.log('  ✅ Mounted: /api/trips (protected)');

app.use("/api/itinerary", itineraryRouter);
console.log('  ✅ Mounted: /api/itinerary');

app.use("/api/chat", chatRouter);
console.log('  ✅ Mounted: /api/chat');

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Available endpoints:`);
  console.log(`   - http://localhost:${PORT}/api/auth/*`);
  console.log(`   - http://localhost:${PORT}/api/flights/*`);
  console.log(`   - http://localhost:${PORT}/api/hotels/*`);
  console.log(`   - http://localhost:${PORT}/api/trips/*`);
  console.log(`   - http://localhost:${PORT}/api/itinerary/*`);
  console.log(`   - http://localhost:${PORT}/api/chat/*\n`);
});