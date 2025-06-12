// Chat Component
// This component provides real-time private messaging functionality between users
// It uses Socket.IO for real-time communication and maintains chat history

import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../styles/components.css";
import "../styles/Chat.css";

const API_BASE = process.env.REACT_APP_API_BASE;

function Chat() {
  // Get current user and location state (for direct messages from search)
  const { user } = useUser();
  const location = useLocation();
  const selectedUserIdFromSearch = location.state?.selectedUserId || null;

  // State management for chat functionality
  const [message, setMessage] = useState(""); // Current message input
  const [chatMessages, setChatMessages] = useState([]); // All messages in current chat
  const [socket, setSocket] = useState(null); // Socket.io connection
  const [selectedUser, setSelectedUser] = useState(null); // Currently selected chat user
  const [recentChats, setRecentChats] = useState([]); // List of recent chat users
  const [roomId, setRoomId] = useState(null); // Current chat room ID
  const messagesEndRef = useRef(null); // Reference for auto-scrolling
  const [isOpen, setIsOpen] = useState(false); // Dropdown state for user selection

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    // Listen for incoming messages
    newSocket.on("receive_private_message", (data) => {
      console.log("📥 Message received:", data);
      if (data.roomId === roomId && data.sender !== user?.username) {
        setChatMessages((prev) => [...prev, data]);
      }
    });

    // Handle connection errors
    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [roomId, user?.username]);

  // Fetch all users and handle direct message from search
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/users`);
        const filteredUsers = response.data.filter((u) => u._id !== user?._id);
        // If user came from search with a specific user selected
        if (selectedUserIdFromSearch) {
          const found = filteredUsers.find(
            (u) => u._id === selectedUserIdFromSearch
          );
          if (found) setSelectedUser(found);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    if (user) {
      fetchUsers();
    }
  }, [user, selectedUserIdFromSearch]);

  // Fetch recent chat history
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/messages/${user.username}`
        );
        setRecentChats(response.data);
      } catch (error) {
        console.error("Error fetching recent chats:", error);
      }
    };
    if (user) {
      fetchRecentChats();
    }
  }, [user]);

  // Join chat rooms for all recent chats
  useEffect(() => {
    if (socket && user && recentChats.length > 0) {
      recentChats.forEach((chatUser) => {
        socket.emit("join_private_chat", {
          userId: user._id,
          otherUserId: chatUser._id,
        });
      });
    }
  }, [socket, user, recentChats]);

  // Handle user selection and room joining
  useEffect(() => {
    if (socket && selectedUser && user) {
      // Create unique room ID by sorting user IDs
      const newRoomId = [user._id, selectedUser._id].sort().join("_");
      setRoomId(newRoomId);
      socket.emit("join_private_chat", {
        userId: user._id,
        otherUserId: selectedUser._id,
      });
      fetchMessages(newRoomId);
    }
  }, [selectedUser, socket, user]);

  // Fetch message history for selected chat
  const fetchMessages = async (roomId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/messages/room/${roomId}`
      );
      setChatMessages(response.data);
    } catch (error) {
      console.error("Error loading message history:", error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle sending new messages
  const sendMessage = () => {
    if (!socket || !roomId || !user || !selectedUser || message.trim() === "")
      return;
    
    const newMessage = {
      roomId,
      message: message.trim(),
      sender: user.username,
      timestamp: new Date().toISOString(),
    };
    
    socket.emit("send_private_message", newMessage);
    setChatMessages(prev => [...prev, newMessage]);
    setMessage("");
  };

  // Group messages by date for display
  const groupedMessages = chatMessages.reduce((acc, msg) => {
    const dateKey = new Date(msg.timestamp).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  // Component render
  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        {/* Sidebar with user selection */}
        <aside className="chat-sidebar">
          <div
            style={{
              position: "relative",
              width: "100%",
              marginBottom: "12px",
            }}
          >
            {/* User selection dropdown button */}
            <button
              className="chat-dropdown-btn"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                width: "100%",
                padding: "14px 18px",
                background: "var(--surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "all 0.2s ease",
                direction: "rtl",
                fontSize: "17px",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  direction: "rtl",
                }}
              >
                <span
                  className="material-icons"
                  style={{ fontSize: "22px", color: "var(--primary)" }}
                >
                  chat
                </span>
                שיחות אחרונות
              </span>
              <span
                className="material-icons"
                style={{
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  fontSize: "22px",
                }}
              >
                expand_more
              </span>
            </button>

            {/* Desktop dropdown */}
            {isOpen && (
              <div
                className="chat-dropdown-list"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "var(--background)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "14px",
                  marginTop: "4px",
                  maxHeight: "320px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
                  padding: "8px",
                  minWidth: "180px",
                  direction: "rtl",
                }}
              >
                {/* Recent chat users list */}
                {recentChats.map((chatUser) => (
                  <button
                    key={chatUser._id}
                    className="chat-dropdown-bubble"
                    onClick={() => {
                      setSelectedUser(chatUser);
                      setIsOpen(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "14px 18px",
                      textAlign: "right",
                      background:
                        selectedUser?._id === chatUser._id
                          ? "var(--primary-light)"
                          : "var(--surface)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      marginBottom: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "var(--text-primary)",
                      fontSize: "17px",
                      direction: "rtl",
                      fontWeight: 400,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        direction: "rtl",
                      }}
                    >
                      <span
                        className="material-icons"
                        style={{ fontSize: "20px", color: "var(--primary)" }}
                      >
                        person
                      </span>
                      {chatUser.username}
                    </span>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "14px",
                        background: "var(--surface)",
                        padding: "4px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      {chatUser.city}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Mobile modal dropdown */}
            {isOpen && (
              <div className="chat-modal-list" style={{ display: "none" }}>
                <div className="chat-modal-header">
                  <span>שיחות אחרונות</span>
                  <span
                    className="material-icons chat-modal-close"
                    onClick={() => setIsOpen(false)}
                  >
                    close
                  </span>
                </div>
                <div className="chat-modal-bubbles">
                  {recentChats.map((chatUser) => (
                    <button
                      key={chatUser._id}
                      className="chat-dropdown-bubble"
                      onClick={() => {
                        setSelectedUser(chatUser);
                        setIsOpen(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "14px 18px",
                        textAlign: "right",
                        background:
                          selectedUser?._id === chatUser._id
                            ? "var(--primary-light)"
                            : "var(--surface)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "16px",
                        marginBottom: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "var(--text-primary)",
                        fontSize: "17px",
                        direction: "rtl",
                        fontWeight: 400,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          direction: "rtl",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "20px", color: "var(--primary)" }}
                        >
                          person
                        </span>
                        {chatUser.username}
                      </span>
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "14px",
                          background: "var(--surface)",
                          padding: "4px 8px",
                          borderRadius: "12px",
                        }}
                      >
                        {chatUser.city}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <main className="chat-main">
          {/* Chat header */}
          <div className="chat-header">
            {selectedUser
              ? `משוחח עם: ${selectedUser.username} (${selectedUser.city})`
              : "לא נבחר משתמש"}
          </div>

          {/* Messages display */}
          <div className="chat-messages">
            {Object.entries(groupedMessages).map(([dateStr, messages]) => (
              <div key={dateStr}>
                <div className="chat-date-separator">{dateStr}</div>
                {messages.map((msg, index) => {
                  const timeStr = new Date(msg.timestamp).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  );
                  return (
                    <div
                      key={index}
                      className={`chat-message ${
                        msg.sender === user.username ? "sent" : "received"
                      }`}
                    >
                      <div className="chat-bubble">
                        <strong>{msg.sender}</strong>: {msg.message}
                        <div className="chat-time">{timeStr}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="chat-input">
            <input
              type="text"
              placeholder="הקלד הודעה..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>שלח</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Chat;
