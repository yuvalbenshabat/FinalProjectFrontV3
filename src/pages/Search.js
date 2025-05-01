import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

const API_BASE = process.env.REACT_APP_API_BASE;

export default function Search() {
  const { user } = useUser();

  const [filters, setFilters] = useState({
    bookTitle: "",
    author: "",
    grade: "",
    condition: "",
    subject: ""
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDonorId, setOpenDonorId] = useState(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${API_BASE}/api/donatedBooks?${query}`);
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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDonor = (bookId) => {
    setOpenDonorId(prev => prev === bookId ? null : bookId);
  };

  const handleChat = (donorId) => {
    if (!user) {
      alert("🔒 עליך להתחבר כדי לשלוח הודעה.");
      return;
    }
    window.location.href = `/chat/${donorId}`;
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

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔍 חיפוש ספרים לתרומה</h2>

        <div style={styles.filters}>
          <input type="text" name="author" placeholder="מחבר" value={filters.author} onChange={handleChange} style={styles.input} />
          <input type="text" name="bookTitle" placeholder="שם הספר" value={filters.bookTitle} onChange={handleChange} style={styles.input} />
          <input type="text" name="grade" placeholder="כיתה" value={filters.grade} onChange={handleChange} style={styles.input} />
          <input type="text" name="subject" placeholder="מקצוע" value={filters.subject} onChange={handleChange} style={styles.input} />
          <select name="condition" value={filters.condition} onChange={handleChange} style={styles.input}>
            <option value="">מצב הספר</option>
            <option value="טוב">טוב</option>
            <option value="סביר">סביר</option>
            <option value="לא טוב">לא טוב</option>
          </select>
          <button onClick={fetchBooks} style={styles.searchButton}>🔍 בצע חיפוש</button>
        </div>

        {loading ? (
          <p style={{ marginTop: "30px", fontSize: "18px" }}>⏳ טוען ספרים...</p>
        ) : results.length > 0 ? (
          results.map((book) => (
            <div key={book._id} style={styles.bookCard}>
              <h3>{book.bookTitle}</h3>
              <p>מחבר: {book.author}</p>
              <p>כיתה: {book.grade}</p>
              <p>מקצוע: {book.subject || "לא ידוע"}</p>
              <p>מצב: {book.condition}</p>

              <button style={styles.reserveButton} onClick={() => handleReserve(book._id)}>
                📚 שריין ספר
              </button>

              <button style={styles.donorToggleButton} onClick={() => toggleDonor(book._id)}>
                {openDonorId === book._id ? "⬆️ הסתר פרטי תורם" : "⬇️ הצג פרטי תורם"}
              </button>

              {openDonorId === book._id && book.donor && (
                <div style={styles.donorBox}>
                  <p>שם: {book.donor.username || "לא ידוע"}</p>
                  <p>עיר: {book.donor.city || "לא ידוע"}</p>
                  <button style={styles.chatButton} onClick={() => handleChat(book.userId)}>
                    💬 צ'אט עם התורם
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ marginTop: "30px", fontSize: "18px" }}>😥 לא נמצאו ספרים תואמים.</p>
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
  searchButton: {
    padding: "10px 20px",
    backgroundColor: "#1d72b8",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    gridColumn: "1 / -1"
  },
  bookCard: {
    backgroundColor: "#e6ecff",
    padding: "20px",
    marginBottom: "20px",
    borderRadius: "15px",
    textAlign: "right",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  reserveButton: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer"
  },
  donorToggleButton: {
    marginTop: "10px",
    marginRight: "10px",
    padding: "8px",
    backgroundColor: "#FFD700",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  donorBox: {
    marginTop: "10px",
    padding: "15px",
    backgroundColor: "#fff9e6",
    borderRadius: "10px",
    textAlign: "right",
    boxShadow: "0 1px 6px rgba(0,0,0,0.1)"
  },
  chatButton: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer"
  }
};
