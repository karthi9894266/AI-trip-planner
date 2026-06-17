const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure your .env file contains this key
});

async function generateItinerary({ destination, numberOfDays, preferences }) {
  const prompt = `
You are a travel planner. Create a ${numberOfDays}-day travel itinerary for a trip to ${destination}.
The traveler prefers: ${preferences.join(', ')}.
Each day should have a short 1–2 sentence plan. Don't include headings or lists.

Example:
Day 1: ...
Day 2: ...
  `;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('Itinerary generation failed:', err);
    return 'Itinerary unavailable due to an error.';
  }
}

module.exports = generateItinerary;
