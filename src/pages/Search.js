import React, { useEffect, useState } from "react";

export default function Search() {
  const [filters, setFilters] = useState({
    bookTitle: "",
    author: "",
    grade: "",
    condition: ""
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`http://localhost:3001/api/donatedBooks?${query}`);
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
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReserve = async (bookId) => {
    const confirmed = window.confirm("האם אתה בטוח שברצונך לשריין את הספר?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3001/api/reservedBooks/reserve/${bookId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reservedBy: "user123" // ✅ כאן בעתיד תכניס את ה-ID האמיתי של המשתמש
        })
      });

      if (response.ok) {
        alert("✅ הספר שוריין בהצלחה!");
        fetchBooks(); // רענון הספרים
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
              <h3 style={{ marginBottom: "10px" }}>{book.bookTitle}</h3>
              <p>מחבר: {book.author}</p>
              <p>כיתה: {book.grade}</p>
              <p>תחום: {book.subject || "לא ידוע"}</p>
              <p>מצב: {book.condition}</p>
              <button 
                style={styles.reserveButton}
                onClick={() => handleReserve(book._id)}
              >
                📚 שריין ספר
              </button>
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
    border: "none",
    backgroundColor: "#4CAF50",
    color: "white",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer"
  }
};
