// Search Component
// This component provides a comprehensive search interface for donated books
// Features:
// - Advanced filtering options (title, author, grade, condition)
// - Distance-based search using user's location
// - Book reservation functionality
// - Chat with book donors
// - Responsive grid layout for search results

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;

export default function Search() {
  // Get user data and navigation functions from context/hooks
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract search parameters from navigation state
  const { title = "", grade = "" } = location.state || {};

  // State for search filters
  const [filters, setFilters] = useState({
    bookTitle: title,
    author: "",
    grade: grade,
    condition: ""
  });

  // State for search results and UI status
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user has location data for distance-based search
  useEffect(() => {
    if (!user?.location) {
      setError("לא נמצאו נתוני מיקום. חלק מהתכונות עלולות להיות מוגבלות.");
    }
  }, [user]);

  // Fetch books based on current filters
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams(filters);

      // Add user location for distance-based search if available
      if (user?.location?.lat && user?.location?.lng) {
        const lat = parseFloat(user.location.lat);
        const lng = parseFloat(user.location.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          params.append("lat", lat.toString());
          params.append("lng", lng.toString());
        }
      }

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

  // Handle changes in filter inputs
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

    // Check if the book belongs to the logged in user
    const book = results.find(book => book._id === bookId);
    if (book && book.userId === user._id) {
      setError("לא ניתן לשריין ספר שתרמת בעצמך");
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

      fetchBooks(); // Refresh results after reservation
    } catch (error) {
      console.error("שגיאה בעת שריון ספר:", error);
      setError(error.message);
    }
  };

  // Navigate to chat with book donor
  const handleChat = (donorId) => {
    if (donorId === user?._id) {
      setError("לא ניתן לפתוח צ'אט עם עצמך");
      return;
    }
    navigate("/chat", { state: { selectedUserId: donorId } });
  };

  return (
    <div className="md-container">
      <div className="search-page">
        <div className="md-card search-container">
          {/* Header section with title and results count */}
          <div className="search-header">
            <span className="material-icons">search</span>
            <h1 className="md-text-xl">חיפוש ספרים לתרומה</h1>
            {!loading && (
              <div className="search-results-count">
                נמצאו {results.length} ספרים
              </div>
            )}
          </div>

          {/* Error message display */}
          {error && (
            <div className="md-status md-status-error">
              <span className="material-icons">error</span>
              {error}
            </div>
          )}

          {/* Search filters section */}
          <div className="search-filters md-grid">
            {/* Book title filter */}
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
            {/* Author filter */}
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
            {/* Grade filter */}
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
            {/* Book condition filter */}
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

          {/* Search results section */}
          <div className="search-results">
            {/* Loading state */}
            {loading ? (
              <div className="md-loading">
                <div className="md-loading-spinner" />
                <span>טוען ספרים...</span>
              </div>
            ) : results.length > 0 ? (
              // Grid of book results
              <div className="books-grid">
                {results.map((book) => (
                  // Individual book card
                  <div key={book._id} className="book-card">
                    <div className="book-card__content">
                      {/* Book main information */}
                      <div className="book-card__main-info">
                        <h3 className="book-card__title">{book.bookTitle}</h3>

                        <div className="book-card__content-wrapper">
                          {/* Book image section */}
                          <div className="book-card__image-container">
                            {book.imgUrl ? (
                              <img
                                src={book.imgUrl}
                                alt={`תמונה של ${book.bookTitle}`}
                                className="book-card__image"
                              />
                            ) : (
                              <div className="book-card__no-image">
                                <span className="material-icons">menu_book</span>
                              </div>
                            )}
                          </div>

                          {/* Book details section */}
                          <div className="book-card__details">
                            {/* Donor information */}
                            <div className="book-card__detail-row">
                              <span className="book-card__label">תורם: </span>
                              <span className="book-card__value" style={{ color: book.userId === user?._id ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                                {book.username || "משתמש לא ידוע"}
                                {book.userId === user?._id && " (אתה)"}
                              </span>
                            </div>

                            {/* Author information */}
                            <div className="book-card__detail-row">
                              <span className="book-card__value">
                                {book.author}
                              </span>
                            </div>

                            {/* Grade information */}
                            <div className="book-card__detail-row">
                              <span className="book-card__label">כיתה: </span>
                              <span className="book-card__value">
                                {book.grade}
                              </span>
                            </div>

                            {/* City information */}
                            <div className="book-card__detail-row">
                              <span className="book-card__label">עיר: </span>
                              <span className="book-card__value">
                                {book.city || "עיר לא ידועה"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Book condition and distance tags */}
                        <div className="book-card__tags">
                          <span className="book-card__condition-tag">
                            <span className="book-card__tag-label">מצב: </span>
                            {book.condition}
                          </span>
                          {typeof book.distanceKm === "number" && (
                            <span className="book-card__distance-tag">
                              <span className="book-card__tag-label">מרחק: </span>
                              {book.distanceKm === 0 ? "בעיר שלך" : `${book.distanceKm.toFixed(1)} ק״מ`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons section */}
                      <div className="book-card__actions">
                        {/* Reserve book button */}
                        <button
                          className="book-card__button book-card__button--primary"
                          onClick={() => handleReserve(book._id)}
                        >
                          <span className="material-icons">bookmark</span>
                          שריין ספר
                        </button>
                        {/* Chat with donor button */}
                        <button
                          className="book-card__button book-card__button--secondary"
                          onClick={() => handleChat(book.userId)}
                        >
                          <span className="material-icons">chat</span>
                          צ'אט
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
          min-height: calc(100vh - 64px);
          background-color: var(--surface);
          padding: var(--spacing-xl) var(--spacing-md);
        }

        .search-container {
          background: var(--background);
          padding: var(--spacing-xl);
          max-width: 1200px;
          margin: 0 auto;
        }

        .search-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
        }

        .search-results-count {
          background: #f0f4ff;
          color: #3b82f6;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid #e0e7ff;
          margin-right: auto;
        }

        .search-filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        /* Book Cards Grid Layout */
        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--spacing-md);
          padding: var(--spacing-md);
        }

        /* Book Cards Grid Layout - Mobile Style */
        @media (max-width: 768px) {
          .books-grid {
            display: flex;
            flex-direction: column;
            gap: 1px;
            padding: 0;
            background: #f5f5f5;
          }

          .book-card {
            width: 100%;
            margin: 0;
          }
        }

        .book-card {
          display: flex;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
          width: 100%;
          padding: 16px;
          gap: 16px;
          height: 100%;
        }

        .book-card:hover {
          background: #f8fafc;
        }

        .book-card__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .book-card__image-container {
          width: 120px;
          height: 120px;
          flex-shrink: 0;
          overflow: hidden;
          background: #f8f8f8;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .book-card__image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          border-radius: 8px;
        }

        .book-card__no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
        }

        .book-card__no-image .material-icons {
          font-size: 40px;
          color: #ccc;
        }

        .book-card__main-info {
          flex: 1;
        }

        .book-card__title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 3px;
          color: #333;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .book-card__author-line {
          font-size: 14px;
          color: #666;
          font-weight: 400;
          margin-bottom: 4px;
          font-style: italic;
        }

        .book-card__meta {
          display: flex;
          align-items: center;
          margin-bottom: 2px;
          font-size: 13px;
          color: #666;
          flex-wrap: wrap;
          gap: 4px;
        }

        .book-card__label {
          color: #999;
          font-size: 13px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .book-card__author {
          color: #666;
          font-weight: 400;
        }

        .book-card__separator {
          margin: 0 6px;
          color: #ccc;
        }

        .book-card__grade {
          color: #333;
          font-weight: 500;
          font-size: 13px;
          margin-right: 4px;
        }

        .book-card__tag-label {
          color: inherit;
          font-weight: normal;
          font-size: inherit;
        }

        .book-card__tags {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }

        .book-card__condition-tag,
        .book-card__distance-tag {
          background: #f0f4ff;
          color: #3b82f6;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #e0e7ff;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .book-card__distance-tag {
          background: #f0fdf4;
          color: #16a34a;
          border-color: #dcfce7;
        }

        .book-card__donor-info {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #999;
          margin-bottom: 6px;
        }

        .book-card__donor-name {
          font-weight: 500;
          color: #333;
          font-size: 12px;
          margin-right: 4px;
        }

        .book-card__city {
          color: #333;
          font-weight: 500;
          font-size: 12px;
        }

        .book-card__actions {
          display: flex;
          gap: 6px;
          margin-top: auto;
        }

        .book-card__button {
          height: 36px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
          white-space: nowrap;
          padding: 0 14px;
          min-width: 90px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .book-card__button:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .book-card__button--primary {
          background: #10b981;
          color: white;
          font-weight: 600;
          border-color: #10b981;
        }

        .book-card__button--primary:hover {
          background: #047857;
        }

        .book-card__button--secondary {
          background: white;
          color: #6c757d;
          border-color: #dee2e6;
        }

        .book-card__button--secondary:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
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

        /* רספונסיביות מותאמת למובייל */
        @media (max-width: 768px) {
          .search-container {
            padding: var(--spacing-lg);
          }
          
          .search-filters {
            grid-template-columns: 1fr;
            gap: var(--spacing-sm);
          }

          .search-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }

          .search-results-count {
            font-size: 13px;
            padding: 4px 10px;
            margin-right: 0;
            align-self: flex-end;
          }
        }

        @media (max-width: 480px) {
          .search-page {
            padding: 8px 0;
          }
          
          .search-container {
            padding: 12px;
          }

          .book-card {
            height: auto;
            min-height: 130px;
          }

          .book-card__image-container {
            width: 90px;
            height: 90px;
            margin: 12px 12px 12px 0;
            flex-shrink: 0;
            overflow: hidden;
            position: relative;
          }

          .book-card__content {
            padding: 12px 16px 12px 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .book-card__main-info {
            margin-bottom: 8px;
          }

          .book-card__title {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 4px;
            line-height: 1.3;
          }

          .book-card__author-line {
            font-size: 13px;
            margin-bottom: 8px;
            color: #666;
          }

          .book-card__meta {
            font-size: 12px;
            margin-bottom: 8px;
          }

          .book-card__label {
            font-size: 11px;
            font-weight: 500;
          }

          .book-card__tags {
            margin-bottom: 10px;
            gap: 8px;
          }

          .book-card__condition-tag,
          .book-card__distance-tag {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 12px;
          }

          .book-card__tag-label {
            font-size: 10px;
            font-weight: 600;
          }

          .book-card__donor-info {
            font-size: 11px;
            margin-bottom: 10px;
          }

          .book-card__actions {
            gap: 8px;
            margin-top: auto;
          }

          .book-card__button {
            height: 38px;
            font-size: 12px;
            font-weight: 500;
            padding: 0 12px;
            min-width: 75px;
            max-width: 95px;
            border-radius: 6px;
          }

          .book-card__button .material-icons {
            font-size: 16px;
          }

          .search-filters {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        @media (max-width: 375px) {
          .search-container {
            padding: 8px;
          }

          .book-card__image-container {
            width: 80px;
            height: 80px;
            margin: 10px 10px 10px 0;
            overflow: hidden;
            position: relative;
          }

          .book-card__content {
            padding: 10px 12px 10px 0;
          }

          .book-card__title {
            font-size: 14px;
          }

          .book-card__author-line {
            font-size: 12px;
            margin-bottom: 6px;
          }

          .book-card__button {
            height: 36px;
            font-size: 11px;
            padding: 0 10px;
            min-width: 70px;
            max-width: 85px;
          }

          .book-card__button .material-icons {
            font-size: 14px;
          }
        }

        .book-card__details {
          flex: 1;
        }

        .book-card__detail-row {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }

        .book-card__value {
          color: #363636;
          font-size: 14px;
          font-weight: 600;
        }

        .book-card__detail-row:first-child .book-card__value {
          color: #666;
          font-style: italic;
          font-weight: normal;
        }

        .book-card__detail-row .material-icons {
          font-size: 18px;
          color: #3b82f6;
        }

        .book-card__content-wrapper {
          display: flex;
          gap: 16px;
          margin: 12px 0;
        }
      `}</style>
    </div>
  );
}
