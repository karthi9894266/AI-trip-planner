import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", // links chat to a user
    required: true 
  },
  messages: [
    {
      role: { type: String, enum: ["user", "bot"], required: true }, // who sent it
      content: { type: String, required: true }, // the actual message
      timestamp: { type: Date, default: Date.now } // time sent
    }
  ]
});

export default mongoose.model("Chat", chatSchema);