// hf-test.js
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference('YOUR_HF_API_KEY'); // replace with your key

(async () => {
  try {
    const prompt = "Plan a 2-day trip to Paris. Preferences: historical, romantic.";
    
    const response = await hf.textGeneration({
      model: 'google/flan-t5-base', // smaller model, works on free-tier
      inputs: prompt,
      parameters: { max_new_tokens: 100 }
    });

    console.log('Generated Itinerary:');
    console.log(response.generated_text);
  } catch (err) {
    console.error('HF test failed:', err);
  }
})();
