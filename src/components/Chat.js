import React, { useState } from "react";
import "./Chat.css"; // לוודא שקיים הקובץ לעיצוב

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const currentUser = "me"; // אפשר לשנות ל ID אמיתי בהמשך

  const handleSend = () => {
    if (input.trim() === "") return;

    const newMessage = {
      id: Date.now(),
      sender: currentUser,
      text: input,
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">📨 צ'אט עם משתמש</div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.sender === currentUser ? "me" : "other"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="הקלד הודעה..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>שלח</button>
      </div>
    </div>
  );
}
