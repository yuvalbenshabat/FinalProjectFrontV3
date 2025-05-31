// 📁 נתיב: /pages/ReservedBooks.js
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE;

export default function ReservedBooks() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [reservedBooks, setReservedBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReservedBooks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/reservedBooks/user/${user._id}`);
      const data = await res.json();
      setReservedBooks(data);
    } catch (err) {
      console.error("❌ שגיאה בשליפת ספרים משוריינים:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservedBooks();
  }, [user]);

  const handleConfirmPickup = async (bookId) => {
    if (!window.confirm("האם אתה בטוח שהספר נמסר בהצלחה?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/reservedBooks/confirm/${bookId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchReservedBooks();
      } else {
        alert("❌ שגיאה באישור קבלה");
      }
    } catch (err) {
      console.error("❌ שגיאה באישור קבלה:", err);
    }
  };

  const handleCancelReservation = async (bookId) => {
    if (!window.confirm("האם אתה בטוח שברצונך לבטל את השריון?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/reservedBooks/cancel/${bookId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchReservedBooks();
      } else {
        alert("❌ שגיאה בביטול השריון");
      }
    } catch (err) {
      console.error("❌ שגיאה בביטול שריון:", err);
    }
  };

  const handleChat = (donorId) => {
    navigate("/chat", { state: { selectedUserId: donorId } });
  };

  const formatRemainingTime = (dateString) => {
    if (!dateString) return "אין מידע";
    const now = new Date();
    const end = new Date(dateString);
    const diffMs = end - now;

    if (diffMs <= 0) return "פג תוקף השריון";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours} שעות ו-${diffMinutes} דקות`;
    } else {
      return `${diffMinutes} דקות`;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>📚 הספרים ששיריינתי</h2>

        {loading ? (
          <p>טוען ספרים...</p>
        ) : reservedBooks.length > 0 ? (
          reservedBooks.map((book) => (
            <div key={book._id} style={styles.bookCard}>
              <h3>{book.bookTitle}</h3>
              <p>מחבר: {book.author}</p>
              <p>כיתה: {book.grade}</p>
              <p>תחום: {book.subject || "לא ידוע"}</p>
              <p>מצב: {book.condition}</p>
              <p style={styles.timeLeft}>
                ⏳ הזמן שנותר לשריון: {formatRemainingTime(book.reservedUntil)}
              </p>
              <div style={styles.buttons}>
                <button onClick={() => handleConfirmPickup(book._id)} style={styles.confirm}>
                  ✔️ אשר קבלה
                </button>
                <button onClick={() => handleCancelReservation(book._id)} style={styles.cancel}>
                  ❌ בטל שריון
                </button>
                <button
                  onClick={() => handleChat(book.userId)}
                  style={{ ...styles.confirm, backgroundColor: '#2196f3' }}
                >
                  💬 צ'אט עם התורם
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>אין ספרים משוריינים.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#f2f6ff",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: "40px",
    direction: "rtl"
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "800px",
    textAlign: "center"
  },
  title: {
    marginBottom: "30px",
    color: "#333",
    fontSize: "28px"
  },
  bookCard: {
    backgroundColor: "#e6ecff",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "15px",
    textAlign: "right",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  timeLeft: {
    color: "#1a237e",
    fontSize: "14px",
    marginTop: "10px",
    fontWeight: "bold"
  },
  buttons: {
    marginTop: "15px",
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  confirm: {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  cancel: {
    backgroundColor: "#f44336",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  }
};
