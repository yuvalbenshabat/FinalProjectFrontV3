// components/Chat.js
import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE;

function Chat() {
  const { user } = useUser();
  const location = useLocation();
  const selectedUserIdFromSearch = location.state?.selectedUserId || null;

  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const messagesEndRef = useRef(null);

  // התחברות ל-socket
  useEffect(() => {
    
const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
  transports: ['websocket'],
});

    setSocket(newSocket);

    newSocket.on('receive_private_message', (data) => {
      console.log("📥 התקבלה הודעה חדשה מהשרת:", data);
      setChatMessages((prev) => [...prev, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // שליפת משתמשים
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/users`);
        const filteredUsers = response.data.filter(u => u._id !== user?._id);
        setUsers(filteredUsers);

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

  // שליפת שיחות אחרונות
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

  // הצטרפות אוטומטית לחדרים של שיחות קודמות
  useEffect(() => {
    if (socket && user && recentChats.length > 0) {
      recentChats.forEach(chatUser => {
        const autoRoomId = [user._id, chatUser._id].sort().join('_');
        socket.emit('join_private_chat', {
          userId: user._id,
          otherUserId: chatUser._id
        });
        console.log("🔁 הצטרפות אוטומטית לחדר:", autoRoomId);
      });
    }
  }, [socket, user, recentChats]);

  // טעינת הודעות והצטרפות לחדר עם משתמש נבחר
  useEffect(() => {
    if (socket && selectedUser && user) {
      const newRoomId = [user._id, selectedUser._id].sort().join('_');
      console.log("📡 מצטרף ידנית לחדר:", newRoomId);
      setRoomId(newRoomId);
      socket.emit('join_private_chat', {
        userId: user._id,
        otherUserId: selectedUser._id
      });
      fetchMessages(newRoomId);
    }
  }, [selectedUser, socket, user]);

  // טעינת הודעות מחדר
  const fetchMessages = async (roomId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/messages/room/${roomId}`);
      setChatMessages(response.data);
    } catch (error) {
      console.error("שגיאה בטעינת הודעות קודמות:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!socket || !roomId || message.trim() === '') return;

    socket.emit('send_private_message', {
      roomId,
      message: message.trim(),
      sender: user.username,
      timestamp: new Date().toISOString()
    });
    setMessage('');
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h2>💬 צ'אט פרטי</h2>

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

      <div style={{ marginBottom: 20 }}>
        <select
          value={selectedUser?._id || ''}
          onChange={(e) => {
            const user = users.find(u => u._id === e.target.value);
            setSelectedUser(user);
          }}
          style={{ padding: 8, width: '100%', marginBottom: 10 }}
        >
          <option value="">בחר משתמש לצ'אט</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.username} ({user.city})
            </option>
          ))}
        </select>
      </div>

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
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex' }}>
            <input
              type="text"
              placeholder="הקלד הודעה..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: 20,
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
