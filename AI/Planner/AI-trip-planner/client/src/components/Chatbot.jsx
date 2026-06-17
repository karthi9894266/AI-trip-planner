import React, { useState, useEffect, useRef } from "react";

const Chatbox = () => {
  const [displayMessages, setDisplayMessages] = useState([
    {
      role: "bot",
      content:
        "Hi! I'm your AI Travel Assistant ✈️✈️ How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const handleSend = async () => {
    const userText = input.trim();
    if (!userText) return;

    // Add user message to display
    const newUserDisplayMsg = { role: "user", content: userText };
    setDisplayMessages((prev) => [...prev, newUserDisplayMsg]);

    setInput("");
    setLoading(true);

    try {
      // ✅ Call your backend API instead of Hugging Face directly
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // ✅ Handle both 'answer' and 'response' fields
      const botText = data.answer || data.response || "Sorry, I couldn't get a response.";

      const newBotDisplayMsg = { role: "bot", content: botText };
      setDisplayMessages((prev) => [...prev, newBotDisplayMsg]);

    } catch (error) {
      console.error("Chat API error:", error);
      setDisplayMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  return (
    <div className="flex flex-col h-[90vh] w-full max-w-2xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
      {/* Header */}
      <header className="p-4 bg-blue-600 text-white text-lg font-semibold">
        Travel Assistant Bot 🌍
      </header>

      {/* Chat messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50">
        {displayMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-xl max-w-xs md:max-w-md ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 text-sm animate-pulse">Thinking...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t flex bg-gray-100">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about travel..."
          className="flex-grow p-2 border rounded-l-lg focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbox;