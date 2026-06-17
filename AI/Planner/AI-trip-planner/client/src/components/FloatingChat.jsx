import React, { useState, useEffect, useRef } from 'react';
import '../styles/FloatingChat.css';

export default function FloatingChat({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      text: "Hi! I'm your AI Travel Assistant ✈️✈️ How can I help you today?" 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = message.trim();
    setMessage('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    
    try {
      console.log('📤 Sending message to chatbot:', userMessage);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          userId: userId 
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Received response:', data);
      
      // ✅ FIX: Handle multiple possible response field names
      const botReply = data.answer || data.response || data.reply || 'Sorry, I encountered an error. Please try again.';
      
      // Add bot response
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: botReply
      }]);
      
    } catch (error) {
      console.error('❌ Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="chat-toggle-btn"
        aria-label="Toggle chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="floating-chat-container">
          {/* Chat Header */}
          <div className="chat-header">
            <div>
              <h3 className="chat-title">Travel Assistant Bot</h3>
              <p className="chat-status">Online</p>
            </div>
            <button 
              onClick={toggleChat}
              className="chat-close-btn"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message ${msg.role === 'user' ? 'message-user' : 'message-bot'}`}
              >
                <div className="message-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="message message-bot">
                <div className="message-bubble">
                  <span className="typing-indicator">●●●</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="chat-input"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                className="chat-send-btn"
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}