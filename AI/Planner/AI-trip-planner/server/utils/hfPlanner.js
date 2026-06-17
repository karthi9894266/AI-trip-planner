import dotenv from 'dotenv';
dotenv.config();

import { HfInference } from '@huggingface/inference';

if (!process.env.HF_API_KEY) {
  console.error("❌ FATAL: HF_API_KEY is missing. Please add it to your .env file.");
  process.exit(1);
}

const hf = new HfInference(process.env.HF_API_KEY);

async function generateItinerary({ 
  destination, 
  numberOfDays, 
  preferences = [], 
  origin = '', 
  startDate = '', 
  endDate = '' 
}) {
  if (!destination || !numberOfDays) {
    throw new Error("Destination and numberOfDays are required");
  }

  console.log('📝 generateItinerary called with:', { 
    destination, 
    numberOfDays, 
    preferences, 
    origin, 
    startDate, 
    endDate 
  });

  const prefsText = preferences.length ? preferences.join(", ") : "sightseeing and exploration";
  
  // ✅ Build message for chat API
  const userMessage = `Create a detailed ${numberOfDays}-day travel itinerary for ${destination}${origin ? ` (traveling from ${origin})` : ''}.

Trip Details:
- Destination: ${destination}
- Duration: ${numberOfDays} days
- Travel Dates: ${startDate} to ${endDate}
- Interests: ${prefsText}

Please provide:
1. Day-by-day breakdown with specific activities
2. Morning, afternoon, and evening plans for each day
3. Specific places to visit (landmarks, attractions, restaurants)
4. Local food recommendations
5. Accommodation suggestions
6. Practical travel tips

Format each day clearly with activities for morning, afternoon, and evening.`;

  try {
    console.log('🤖 Calling Hugging Face Chat Completion API with Qwen2.5-72B-Instruct...');
    
    // ✅ Use chatCompletion instead of textGeneration
    let fullResponse = '';
    
    const stream = hf.chatCompletionStream({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        {
          role: "system",
          content: "You are a professional travel planner who creates detailed, practical travel itineraries with specific recommendations."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9,
    });

    // Collect the streaming response
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const delta = chunk.choices[0].delta;
        if (delta.content) {
          fullResponse += delta.content;
        }
      }
    }

    console.log('📥 Chat API Response received');
    console.log('📏 Generated text length:', fullResponse.length);

    if (!fullResponse || fullResponse.trim().length < 100) {
      throw new Error("Generated text is too short or empty");
    }

    console.log('✅ Real AI itinerary generated successfully using Chat API');
    
    return fullResponse.trim();

  } catch (err) {
    console.error("❌ Chat API Error:", err.message);
    console.error("Error details:", err);
    
    // Specific error handling
    if (err.message && err.message.toLowerCase().includes('loading')) {
      throw new Error("⏳ AI Model is currently loading. Please wait 30-60 seconds and try again.");
    }
    
    if (err.message && err.message.toLowerCase().includes('rate limit')) {
      throw new Error("⚠️ Rate limit reached. Please wait a few minutes before trying again.");
    }

    if (err.message && err.message.toLowerCase().includes('quota')) {
      throw new Error("⚠️ API quota exceeded. Please try again later or check your Hugging Face account.");
    }

    // Generic error - no fallback, let user know
    throw new Error(`Failed to generate AI itinerary: ${err.message}`);
  }
}

export default generateItinerary;