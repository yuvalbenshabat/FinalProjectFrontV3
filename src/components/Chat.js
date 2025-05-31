// Chat Component
// This component provides real-time private messaging functionality between users
// It uses Socket.IO for real-time communication and maintains chat history

import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import '../styles/components.css';

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;

function Chat() {
  // Get current user data and location state
  const { user } = useUser();
  const location = useLocation();
  // Get selected user ID if coming from search page
  const selectedUserIdFromSearch = location.state?.selectedUserId || null;

  // State Management
  const [message, setMessage] = useState('');              // Current message input
  const [chatMessages, setChatMessages] = useState([]);    // Array of chat messages
  const [socket, setSocket] = useState(null);              // Socket.IO connection
  const [selectedUser, setSelectedUser] = useState(null);  // Currently selected chat user
  const [users, setUsers] = useState([]);                  // List of all users
  const [recentChats, setRecentChats] = useState([]);     // Recent chat conversations
  const [roomId, setRoomId] = useState(null);             // Current chat room ID
  const messagesEndRef = useRef(null);                    // Reference for auto-scrolling

  // Initialize Socket.IO connection
  useEffect(() => {
    // Create new socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    // Listen for incoming private messages
    newSocket.on('receive_private_message', (data) => {
      console.log("📥 התקבלה הודעה חדשה מהשרת:", data);

      // Only add message if it belongs to current room
      if (data.roomId === roomId) {
        setChatMessages((prev) => [...prev, data]);
      } else {
        console.log("⚠️ הודעה מחדר אחר – לא נטענת לצ'אט הזה");
      }
    });

    // Handle connection errors
    newSocket.on('connect_error', (err) => {
      console.error('❌ שגיאה בהתחברות ל-socket:', err);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/users`);
        // Filter out current user from the list
        const filteredUsers = response.data.filter(u => u._id !== user?._id);
        setUsers(filteredUsers);

        // If user was selected from search, set them as selected user
        if (selectedUserIdFromSearch) {
          const found = filteredUsers.find(u => u._id === selectedUserIdFromSearch);
          if (found) setSelectedUser(found);
        }
      } catch (error) {
        console.error('שגיאה בשליפת משתמשים:', error);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user, selectedUserIdFromSearch]);

  // Fetch recent chat conversations
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/messages/conversations/${user.username}`);
        setRecentChats(response.data);
      } catch (error) {
        console.error("שגיאה בשליפת שיחות אחרונות:", error);
      }
    };

    if (user) {
      fetchRecentChats();
    }
  }, [user]);

  // Join chat rooms for recent conversations
  useEffect(() => {
    if (socket && user && recentChats.length > 0) {
      recentChats.forEach(chatUser => {
        socket.emit('join_private_chat', {
          userId: user._id,
          otherUserId: chatUser._id
        });
      });
    }
  }, [socket, user, recentChats]);

  // Handle selected user change
  useEffect(() => {
    if (socket && selectedUser && user) {
      // Create unique room ID by sorting and joining user IDs
      const newRoomId = [user._id, selectedUser._id].sort().join('_');
      setRoomId(newRoomId);
      
      // Join private chat room
      socket.emit('join_private_chat', {
        userId: user._id,
        otherUserId: selectedUser._id
      });
      
      // Load previous messages
      fetchMessages(newRoomId);
    }
  }, [selectedUser, socket, user]);

  // Fetch chat history for a room
  const fetchMessages = async (roomId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/messages/room/${roomId}`);
      setChatMessages(response.data);
    } catch (error) {
      console.error("שגיאה בטעינת הודעות קודמות:", error);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send a new message
  const sendMessage = () => {
    if (!socket || !roomId || !user || !selectedUser || message.trim() === '') return;

    socket.emit('send_private_message', {
      roomId,
      message: message.trim(),
      sender: user.username,
      timestamp: new Date().toISOString()
    });

    setMessage('');
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto', direction: 'rtl' }}>
      <h2>💬 צ'אט פרטי</h2>

      {/* Recent Chats Section */}
      {recentChats.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <strong>שיחות אחרונות:</strong>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {recentChats.map((chatUser) => (
              <li key={chatUser._id}>
                <button
                  onClick={() => setSelectedUser(chatUser)}
                  style={{
                    padding: 8,
                    margin: '4px 0',
                    width: '100%',
                    textAlign: 'right',
                    backgroundColor: '#e0f7fa',
                    border: '1px solid #ccc',
                    borderRadius: 10,
                    cursor: 'pointer'
                  }}
                >
                  {chatUser.username} ({chatUser.city})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User Selection Dropdown */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={selectedUser?._id || ''}
          onChange={(e) => {
            const selectedUser = users.find(u => u._id === e.target.value);
            setSelectedUser(selectedUser);
          }}
          style={{ padding: 8, width: '100%' }}
        >
          <option value="">בחר משתמש לצ'אט</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.username} ({user.city})
            </option>
          ))}
        </select>
      </div>

      {/* Chat Messages Area */}
      {selectedUser && (
        <>
          <div style={{
            border: '1px solid #ccc',
            height: 400,
            overflowY: 'scroll',
            padding: 10,
            marginBottom: 10,
            backgroundColor: '#f9f9f9'
          }}>
            {/* Message Bubbles */}
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  textAlign: msg.sender === user.username ? 'left' : 'right',
                  marginBottom: 10
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '8px 12px',
                  borderRadius: 15,
                  backgroundColor: msg.sender === user.username ? '#dcf8c6' : '#fff',
                  border: msg.sender === user.username ? 'none' : '1px solid #ccc',
                  maxWidth: '70%'
                }}>
                  <strong>{msg.sender}:</strong> {msg.message}
                  <small style={{
                    display: 'block',
                    fontSize: '0.8em',
                    color: '#666',
                    marginTop: 4
                  }}>
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </small>
                </div>
              </div>
            ))}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Area */}
          <div style={{ display: 'flex' }}>
            <input
              type="text"
              placeholder="הקלד הודעה..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 20,
                border: '1px solid #ccc',
                marginRight: 10
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: '8px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              שלח
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Chat;