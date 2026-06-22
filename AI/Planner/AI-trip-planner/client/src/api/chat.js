import axios from "axios";

export const sendMessage = async (userId, message) => {
  try {
    const response = await axios.post(
      "https://ai-trip-planner-backend-4ga2.onrender.com/api/chatbot",
      { userId, message },
      { withCredentials: true }
    );
    return response.data.reply;
  } catch (err) {
    console.error("Chatbot API error:", err.response?.data || err.message);
    return "Sorry, something went wrong.";
  }
};

export const fetchChatHistory = async (userId) => {
  try {
    const response = await axios.get(
      `https://ai-trip-planner-backend-4ga2.onrender.com/api/chatbot/history/${userId}`,
      { withCredentials: true }
    );
    return response.data.messages;
  } catch (err) {
    console.error("Chat history API error:", err.response?.data || err.message);
    return [];
  }
};
