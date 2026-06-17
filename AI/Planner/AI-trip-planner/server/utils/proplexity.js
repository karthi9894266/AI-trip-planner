import 'dotenv/config'; 
import { HfInference } from '@huggingface/inference';

// Initialize HfInference using the environment variable for the API key
const hf = new HfInference(process.env.HF_API_KEY);

// ✅ USE A ROBUST, INSTRUCT-TUNED MODEL for general chat conversations.
// Using Qwen model which works well with available providers
const CHAT_MODEL_NAME = "Qwen/Qwen2.5-72B-Instruct"; 

/**
 * Queries the Hugging Face model for a conversational response.
 * @param {string} prompt The user's message/query.
 * @returns {Promise<string>} The AI-generated answer.
 */
export async function queryProplexity(prompt) {
    if (!prompt) {
        throw new Error("Prompt string is required for chat generation.");
    }
    
    try {
        console.log(`💬 Sending chat prompt to model: ${CHAT_MODEL_NAME}`);
        console.log(`🤖 Using chatCompletion API for conversational tasks...`);
        
        // ✅ Use chatCompletion API for conversational tasks
        const response = await hf.chatCompletion({
            model: CHAT_MODEL_NAME,
            messages: [
                {
                    role: "system",
                    content: "You are a friendly and concise travel assistant, designed to answer general travel questions."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        console.log(`📦 Full response received:`, JSON.stringify(response, null, 2));

        // Extract the AI's response from the chat completion format
        if (response && response.choices && response.choices[0] && response.choices[0].message) {
            const answer = response.choices[0].message.content.trim();
            console.log(`✅ Extracted answer: ${answer}`);
            return answer;
        } 
        
        // Alternative format: some providers return just the message
        if (response && response.message && response.message.content) {
            const answer = response.message.content.trim();
            console.log(`✅ Extracted answer (alt format): ${answer}`);
            return answer;
        }
        
        // Alternative format: direct content field
        if (response && response.content) {
            const answer = response.content.trim();
            console.log(`✅ Extracted answer (direct content): ${answer}`);
            return answer;
        }
        
        console.error(`❌ Unexpected response format:`, response);
        throw new Error(`AI returned an unexpected format: ${JSON.stringify(response)}`);
    

    } catch (error) {
        console.error("Hugging Face Chat API Call Error:", error);
        
        // Provide more detailed error information for debugging
        if (error.message.includes('not supported for task')) {
            throw new Error("Model configuration error. Please check the model supports chat completion.");
        }
        
        // Throw a generic error to be caught by the router
        throw new Error("Failed to get response from AI Chatbot");
    }
}

// ⭐️ Provide a default export for modules that import without braces.
export default queryProplexity;