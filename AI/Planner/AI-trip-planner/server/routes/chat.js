import express from 'express';
import { queryProplexity } from '../utils/proplexity.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { message } = req.body;
  
  console.log(`📨 Received chat message: "${message}"`);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const answer = await queryProplexity(message);
    
    console.log(`✅ Sending response to frontend: "${answer}"`);
    
    // Send response in the format the frontend expects
    res.json({ 
      answer: answer,        // Keep for backward compatibility
      response: answer,      // Add this for frontend compatibility
      success: true 
    });
  } catch (err) {
    console.error(`❌ Chat error:`, err);
    res.status(500).json({ 
      error: err.message,
      success: false 
    });
  }
});

export default router;