const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is in your .env file
});

async function generateItinerary(destination, startDate, endDate) {
  try {
    const prompt = `Create a travel itinerary for a trip to ${destination} from ${startDate} to ${endDate}. Provide a day-by-day plan with key activities.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI error:", error);
    return "Itinerary unavailable at the moment.";
  }
}

module.exports = { generateItinerary };
