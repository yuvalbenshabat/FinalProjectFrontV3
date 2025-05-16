// 📁 נתיב: /pages/Search.js
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE;

export default function Search() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const { title = "", grade = "" } = location.state || {};

  const [filters, setFilters] = useState({
    bookTitle: title,
    author: "",
    grade: grade,
    condition: ""
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);

      if (user?.location?.lat && user?.location?.lng) {
        params.append("lat", user.location.lat);
        params.append("lng", user.location.lng);
      }

      const res = await fetch(`${API_BASE}/api/donatedBooks?${params.toString()}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("❌ שגיאה בשליפת ספרים:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReserve = async (bookId) => {
    if (!user) {
      alert("🔒 עליך להתחבר כדי לשריין ספר.");
      return;
    }

    const confirmed = window.confirm("האם אתה בטוח שברצונך לשריין את הספר?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/reservedBooks/reserve/${bookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservedBy: user._id })
      });

      if (response.ok) {
        alert("✅ הספר שוריין בהצלחה!");
        fetchBooks();
      } else {
        alert("❌ שגיאה בשריון הספר.");
      }
    } catch (error) {
      console.error("❌ שגיאה בעת שריון ספר:", error);
      alert("❌ שגיאה בשרת.");
    }
  };

  const handleChat = (donorId) => {
    navigate("/chat", { state: { selectedUserId: donorId } });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔍 חיפוש ספרים לתרומה</h2>

        <div style={styles.filters}>
          <input
            type="text"
            name="author"
            placeholder="מחבר"
            value={filters.author}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            type="text"
            name="bookTitle"
            placeholder="שם הספר"
            value={filters.bookTitle}
            onChange={handleChange}
            style={styles.input}
          />
          <input
            type="text"
            name="grade"
            placeholder="כיתה"
            value={filters.grade}
            onChange={handleChange}
            style={styles.input}
          />
          <select
            name="condition"
            value={filters.condition}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">מצב הספר</option>
            <option value="טוב">טוב</option>
            <option value="סביר">סביר</option>
            <option value="לא טוב">לא טוב</option>
          </select>
        </div>

        {loading ? (
          <p style={{ marginTop: "30px", fontSize: "18px" }}>⏳ טוען ספרים...</p>
        ) : results.length > 0 ? (
          results.map((book) => (
            <div key={book._id} style={styles.bookCard}>
              <div style={styles.bookTitleHeader}>
                <span role="img" aria-label="book">📗</span> {book.bookTitle}
              </div>

              <div style={styles.detailsGrid}>
                <div style={styles.detailBlock}>
                  <p>📘 מחבר: <strong>{book.author}</strong></p>
                  <p>🏫 כיתה: <strong>{book.grade}</strong></p>
                  <p>📚 תחום: <strong>{book.subject || "לא ידוע"}</strong></p>
                  <p>📖 מצב: <strong>{book.condition}</strong></p>
                  {typeof book.distanceKm === 'number' && (
                    <p>📍 מרחק: <strong style={{ color: book.distanceKm === 0 ? '#2e7d32' : '#000' }}>
                      {book.distanceKm === 0 ? "בעיר שלך" : `${book.distanceKm} ק״מ`}
                    </strong></p>
                  )}
                </div>

                <div style={styles.detailBlock}>
                  <p>🧑‍💼 שם התורם: <strong>{book.username || "לא ידוע"}</strong></p>
                  <p>📞 טלפון: <strong>{book.phone || "לא ידוע"}</strong></p>
                  <p>🏙️ עיר: <strong>{book.city || "לא ידוע"}</strong></p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  style={styles.reserveButton}
                  onClick={() => handleReserve(book._id)}
                >
                  🎯 שריין ספר
                </button>
                <button
                  style={{ ...styles.reserveButton, backgroundImage: "linear-gradient(to right, #2196f3, #1e88e5)" }}
                  onClick={() => handleChat(book.userId)}
                >
                  💬 צ׳אט עם התורם
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ marginTop: "30px", fontSize: "18px" }}>😥 לא נמצאו ספרים תואמים.</p>
        )}
      </div>
    </div>
  );
}

// styles נשארים כפי שהגדרת – לא נגעתי בהם

const styles = {
  page: {
    background: "#f2f6ff",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
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
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "30px"
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px"
  },
  bookCard: {
    backgroundColor: "#e6ecff",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "15px",
    textAlign: "right",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  bookTitleHeader: {
    background: "linear-gradient(to left, #c3d9ff, #e0ecff)",
    padding: "10px 15px",
    borderRadius: "10px",
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "15px",
    display: "inline-block",
    color: "#1a237e"
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "10px"
  },
  detailBlock: {
    backgroundColor: "#ffffff",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "15px",
    lineHeight: "1.6"
  },
  reserveButton: {
    marginTop: "15px",
    padding: "12px 24px",
    border: "none",
    backgroundImage: "linear-gradient(to right, #43cea2, #185a9d)",
    color: "white",
    borderRadius: "30px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    alignSelf: "flex-start"
  }
};
