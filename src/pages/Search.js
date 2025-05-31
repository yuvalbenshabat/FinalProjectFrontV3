// 📁 נתיב: /pages/Search.js
// Search Component - Main page for searching and displaying donated books
// This component allows users to search for books, view their details, and interact with donors
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/theme.css";

// Base URL for API calls - loaded from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;

export default function Search() {
  // Get current user data from UserContext
  const { user } = useUser();
  // Get current route location and navigation function
  const location = useLocation();
  const navigate = useNavigate();

  // Extract any pre-filled search parameters from navigation state
  const { title = "", grade = "" } = location.state || {};

  // State for search filters
  const [filters, setFilters] = useState({
    bookTitle: title,  // Initialize with title from navigation if available
    author: "",
    grade: grade,      // Initialize with grade from navigation if available
    condition: ""
  });

  // State for search results and loading status
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // useEffect to log user data and location for debugging
  useEffect(() => {
    if (!user?.location) {
      setError("לא נמצאו נתוני מיקום. חלק מהתכונות עלולות להיות מוגבלות.");
    }
  }, [user]);

  // Main function to fetch books from the API based on current filters
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");
      // Convert filters object to URL parameters
      const params = new URLSearchParams(filters);

      // Add user's location to search parameters if available
      if (user?.location?.lat && user?.location?.lng) {
        const lat = parseFloat(user.location.lat);
        const lng = parseFloat(user.location.lng);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          params.append("lat", lat.toString());
          params.append("lng", lng.toString());
        }
      }

      // Make API call to fetch books with current filters
      const res = await fetch(`${API_BASE}/api/donatedBooks?${params.toString()}`);
      if (!res.ok) throw new Error("שגיאה בשליפת נתונים מהשרת");
      
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("שגיאה בשליפת ספרים:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch books whenever filters change
  useEffect(() => {
    fetchBooks();
  }, [filters]);

  // Handle changes in filter input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle book reservation
  const handleReserve = async (bookId) => {
    if (!user) {
      setError("עליך להתחבר כדי לשריין ספר");
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

      if (!response.ok) throw new Error("שגיאה בשריון הספר");
      
      fetchBooks();  // Refresh the book list
    } catch (error) {
      console.error("שגיאה בעת שריון ספר:", error);
      setError(error.message);
    }
  };

  // Navigate to chat page with selected donor
  const handleChat = (donorId) => {
    navigate("/chat", { state: { selectedUserId: donorId } });
  };

  return (
    <div className="md-container">
      <div className="search-page">
        <div className="md-card search-container">
          {/* Header */}
          <div className="search-header">
            <span className="material-icons">search</span>
            <h1 className="md-text-xl">חיפוש ספרים לתרומה</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="md-status md-status-error">
              <span className="material-icons">error</span>
              {error}
            </div>
          )}

          {/* Search Filters */}
          <div className="search-filters md-grid">
            <div className="md-input-group">
              <span className="material-icons md-input-icon">person</span>
              <input
                type="text"
                name="author"
                className="md-input"
                placeholder="מחבר"
                value={filters.author}
                onChange={handleChange}
              />
            </div>

            <div className="md-input-group">
              <span className="material-icons md-input-icon">book</span>
              <input
                type="text"
                name="bookTitle"
                className="md-input"
                placeholder="שם הספר"
                value={filters.bookTitle}
                onChange={handleChange}
              />
            </div>

            <div className="md-input-group">
              <span className="material-icons md-input-icon">school</span>
              <input
                type="text"
                name="grade"
                className="md-input"
                placeholder="כיתה"
                value={filters.grade}
                onChange={handleChange}
              />
            </div>

            <div className="md-input-group">
              <span className="material-icons md-input-icon">star_rate</span>
              <select
                name="condition"
                className="md-input"
                value={filters.condition}
                onChange={handleChange}
              >
                <option value="">מצב הספר</option>
                <option value="טוב">טוב</option>
                <option value="סביר">סביר</option>
                <option value="לא טוב">לא טוב</option>
              </select>
            </div>
          </div>

          {/* Results Section */}
          <div className="search-results">
            {loading ? (
              <div className="md-loading">
                <div className="md-loading-spinner" />
                <span>טוען ספרים...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="md-grid books-grid">
                {results.map((book) => (
                  <div key={book._id} className="md-card book-card">
                    {/* Book Header */}
                    <div className="book-header">
                      <span className="material-icons book-icon">menu_book</span>
                      <h3 className="md-text-lg">{book.bookTitle}</h3>
                    </div>

                    {/* Book Details */}
                    <div className="book-content">
                      <div className="book-info">
                        <div className="info-row">
                          <span className="material-icons">person</span>
                          <span>מחבר: <strong>{book.author}</strong></span>
                        </div>
                        
                        <div className="info-row">
                          <span className="material-icons">school</span>
                          <span>כיתה: <strong>{book.grade}</strong></span>
                        </div>

                        <div className="info-row">
                          <span className="material-icons">category</span>
                          <span>תחום: <strong>{book.subject || "לא ידוע"}</strong></span>
                        </div>

                        <div className="info-row">
                          <span className="material-icons">star_rate</span>
                          <span>מצב: <strong>{book.condition}</strong></span>
                        </div>

                        {typeof book.distanceKm === 'number' && (
                          <div className="info-row">
                            <span className="material-icons">location_on</span>
                            <span>מרחק: <strong>
                              {book.distanceKm === 0 ? "בעיר שלך" : `${book.distanceKm.toFixed(1)} ק״מ`}
                            </strong></span>
                          </div>
                        )}
                      </div>

                      {/* Donor Details */}
                      <div className="donor-info">
                        <h4 className="md-text-sm">פרטי התורם</h4>
                        <div className="info-row">
                          <span className="material-icons">person_outline</span>
                          <span>שם: <strong>{book.username || "לא ידוע"}</strong></span>
                        </div>
                        
                        <div className="info-row">
                          <span className="material-icons">phone</span>
                          <span>טלפון: <strong>{book.phone || "לא ידוע"}</strong></span>
                        </div>

                        <div className="info-row">
                          <span className="material-icons">location_city</span>
                          <span>עיר: <strong>{book.city || "לא ידוע"}</strong></span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="book-actions">
                        <button
                          className="md-button md-button-primary"
                          onClick={() => handleReserve(book._id)}
                        >
                          <span className="material-icons">bookmark</span>
                          שריין ספר
                        </button>
                        <button
                          className="md-button md-button-secondary"
                          onClick={() => handleChat(book.userId)}
                        >
                          <span className="material-icons">chat</span>
                          צ׳אט עם התורם
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <span className="material-icons">search_off</span>
                <p>לא נמצאו ספרים תואמים</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .search-page {
          padding: var(--md-spacing-xl) 0;
          min-height: calc(100vh - 64px);
        }

        .search-container {
          padding: var(--md-spacing-xl);
        }

        .search-header {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-md);
          margin-bottom: var(--md-spacing-xl);
        }

        .search-header .material-icons {
          font-size: 32px;
          color: var(--md-primary);
        }

        .search-header h1 {
          margin: 0;
          font-weight: var(--md-font-weight-medium);
        }

        .search-filters {
          margin-bottom: var(--md-spacing-xl);
        }

        .book-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: var(--md-spacing-lg);
        }

        .book-header {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-md);
          margin-bottom: var(--md-spacing-lg);
          padding-bottom: var(--md-spacing-md);
          border-bottom: 1px solid var(--md-outline);
        }

        .book-header .book-icon {
          font-size: 32px;
          color: var(--md-primary);
        }

        .book-header h3 {
          margin: 0;
          font-weight: var(--md-font-weight-medium);
        }

        .book-content {
          display: flex;
          flex-direction: column;
          gap: var(--md-spacing-lg);
          flex: 1;
        }

        .book-info, .donor-info {
          display: flex;
          flex-direction: column;
          gap: var(--md-spacing-sm);
        }

        .donor-info {
          padding-top: var(--md-spacing-md);
          border-top: 1px solid var(--md-outline);
        }

        .donor-info h4 {
          margin: 0 0 var(--md-spacing-sm);
          color: var(--md-on-surface-variant);
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-sm);
          color: var(--md-on-surface-variant);
          font-size: var(--md-font-size-sm);
        }

        .info-row .material-icons {
          font-size: 20px;
          color: var(--md-primary);
        }

        .info-row strong {
          color: var(--md-on-surface);
          font-weight: var(--md-font-weight-medium);
        }

        .book-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--md-spacing-md);
          margin-top: auto;
          padding-top: var(--md-spacing-lg);
        }

        .no-results {
          text-align: center;
          padding: var(--md-spacing-2xl);
          color: var(--md-on-surface-variant);
        }

        .no-results .material-icons {
          font-size: 48px;
          margin-bottom: var(--md-spacing-md);
        }

        @media (max-width: 768px) {
          .search-container {
            padding: var(--md-spacing-lg);
          }

          .book-actions {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .search-container {
            padding: var(--md-spacing-md);
          }

          .book-header {
            flex-direction: column;
            align-items: flex-start;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
