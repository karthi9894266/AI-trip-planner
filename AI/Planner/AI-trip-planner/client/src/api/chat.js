import axios from "axios";

export const sendMessage = async (userId, message) => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/chatbot",
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
      `http://localhost:5000/api/chatbot/history/${userId}`,
      { withCredentials: true }
    );
    return response.data.messages;
  } catch (err) {
    console.error("Chat history API error:", err.response?.data || err.message);
    return [];
  }
};
