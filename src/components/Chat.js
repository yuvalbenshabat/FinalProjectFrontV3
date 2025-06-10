// Chat Component
// This component provides real-time private messaging functionality between users
// It uses Socket.IO for real-time communication and maintains chat history

import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../styles/components.css";

const API_BASE = process.env.REACT_APP_API_BASE;

function Chat() {
  const { user } = useUser();
  const location = useLocation();
  const selectedUserIdFromSearch = location.state?.selectedUserId || null;

  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("receive_private_message", (data) => {
      console.log("📥 התקבלה הודעה:", data);
      if (data.roomId === roomId && data.sender !== user?.username) {
        setChatMessages((prev) => [...prev, data]);
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ שגיאה בהתחברות ל-socket:", err);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, user?.username]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/users`);
        const filteredUsers = response.data.filter((u) => u._id !== user?._id);
        setUsers(filteredUsers);
        if (selectedUserIdFromSearch) {
          const found = filteredUsers.find(
            (u) => u._id === selectedUserIdFromSearch
          );
          if (found) setSelectedUser(found);
        }
      } catch (error) {
        console.error("שגיאה בשליפת משתמשים:", error);
      }
    };
    if (user) {
      fetchUsers();
    }
  }, [user, selectedUserIdFromSearch]);

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/messages/${user.username}`
        );
        setRecentChats(response.data);
      } catch (error) {
        console.error("שגיאה בשליפת שיחות אחרונות:", error);
      }
    };
    if (user) {
      fetchRecentChats();
    }
  }, [user]);

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

  useEffect(() => {
    if (socket && selectedUser && user) {
      const newRoomId = [user._id, selectedUser._id].sort().join("_");
      setRoomId(newRoomId);
      socket.emit("join_private_chat", {
        userId: user._id,
        otherUserId: selectedUser._id,
      });
      fetchMessages(newRoomId);
    }
  }, [selectedUser, socket, user]);

  const fetchMessages = async (roomId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/messages/room/${roomId}`
      );
      setChatMessages(response.data);
    } catch (error) {
      console.error("שגיאה בטעינת הודעות קודמות:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  const groupedMessages = chatMessages.reduce((acc, msg) => {
    const dateKey = new Date(msg.timestamp).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <aside className="chat-sidebar">
          <style>{`
            @media (max-width: 600px) {
              .chat-dropdown-btn, .chat-dropdown-list {
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100vw !important;
                margin: 0 !important;
                border-radius: 10px !important;
                font-size: 15px !important;
                padding: 10px 8px !important;
              }
              .chat-dropdown-btn {
                padding: 10px 8px !important;
                font-size: 15px !important;
              }
              .chat-dropdown-list {
                display: none !important;
              }
              .chat-modal-list {
                display: block !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: var(--background, #fff) !important;
                z-index: 9999 !important;
                border-radius: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100vw !important;
                min-width: 0 !important;
                overflow-y: auto !important;
                direction: rtl;
              }
              .chat-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px 16px 8px 16px;
                background: none;
                font-size: 18px;
                font-weight: 600;
              }
              .chat-modal-close {
                cursor: pointer;
                color: var(--text-secondary, #888);
                font-size: 26px;
              }
              .chat-modal-bubbles {
                padding: 16px 8px 24px 8px;
                max-height: calc(100vh - 60px);
                overflow-y: auto;
              }
              .chat-dropdown-bubble {
                font-size: 15px !important;
                padding: 12px 10px !important;
                border-radius: 14px !important;
              }
              .chat-dropdown-bubble span {
                font-size: 13px !important;
              }
            }
          `}</style>
          <div
            style={{
              position: "relative",
              width: "100%",
              marginBottom: "12px",
            }}
          >
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

        <main className="chat-main">
          <div className="chat-header">
            {selectedUser
              ? `משוחח עם: ${selectedUser.username} (${selectedUser.city})`
              : "לא נבחר משתמש"}
          </div>

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

      <style>{`
        .chat-wrapper {
          direction: rtl;
          height: 100vh;
          display: flex;
          justify-content: center;
           padding-top: 60px;
        }
        .chat-container {
          display: flex;
          direction: rtl;
          flex-direction: row-reverse;
          width: 100%;
          max-width: 1200px;
          border: 1px solid #ddd;
          height: 100%;
        }
        .chat-sidebar {
          width: 25%;
          background: #f5f5f5;
          padding: 10px;
          overflow-y: auto;
        }
        .chat-sidebar ul {
          list-style: none;
          padding: 0;
        }
        .chat-sidebar button {
          width: 100%;
          margin-bottom: 8px;
          padding: 8px;
          text-align: right;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: #fff;
        }
        .chat-sidebar button.active {
          font-weight: bold;
          background: #e0f7fa;
        }
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 10px;
          overflow: hidden;
        }
        .chat-header {
          padding: 12px;
          background: #e0f7fa;
          border: 1px solid #ccc;
          border-radius: 10px;
          margin-bottom: 10px;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          background: #f9f9f9;
        }
        .chat-date-separator {
          text-align: center;
          margin: 10px 0;
          color: #888;
          font-size: 0.85em;
        }
        .chat-message {
          display: flex;
          margin-bottom: 10px;
        }
        .chat-message.sent {
          justify-content: flex-start;
        }
        .chat-message.received {
          justify-content: flex-end;
        }
        .chat-bubble {
          max-width: 70%;
          padding: 8px 12px;
          border-radius: 15px;
          background: #dcf8c6;
          border: 1px solid #ccc;
          text-align: right;
        }
        .chat-message.received .chat-bubble {
          background: #fff;
        }
        .chat-time {
          font-size: 0.8em;
          color: #666;
          margin-top: 4px;
        }
        .chat-input {
          display: flex;
          gap: 10px;
          padding: 10px;
          border-top: 2px solid #ddd;
          background: #fff;
          justify-content: flex-end;
        }
        .chat-input input {
          flex: 1;
          padding: 8px;
          border-radius: 20px;
          border: 1px solid #ccc;
        }
        .chat-input button {
          padding: 8px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .chat-container {
            flex-direction: column;
          }
          .chat-sidebar {
            width: 100%;
            border-bottom: 1px solid #ccc;
          }
          .chat-main {
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Chat;
