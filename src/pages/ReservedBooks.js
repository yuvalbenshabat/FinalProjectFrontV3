// 📁 נתיב: /pages/ReservedBooks.js
// Reserved Books Component
// This component manages and displays books that users have reserved
// It provides functionality for:
// - Viewing reserved books
// - Confirming book pickup
// - Canceling reservations
// - Chatting with book donors
// - Tracking reservation time limits

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;

export default function ReservedBooks() {
  // Get current user data and navigation function from context/hooks
  const { user } = useUser();
  const navigate = useNavigate();

  // State management for reserved books and loading status
  const [reservedBooks, setReservedBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all reserved books for the current user
  const fetchReservedBooks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/reservedBooks/user/${user._id}`);
      const data = await res.json();
      setReservedBooks(data);
    } catch (err) {
      console.error("שגיאה בשליפת ספרים משוריינים:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load reserved books on component mount and user changes
  useEffect(() => {
    fetchReservedBooks();
  }, [user]);

  // Handle confirmation when user picks up a book
  // This will remove the book from reserved list
  const handleConfirmPickup = async (bookId) => {
    if (!window.confirm("האם אתה בטוח שהספר נמסר בהצלחה?")) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/reservedBooks/confirm/${bookId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        await fetchReservedBooks(); // Refresh the list after confirmation
      } else {
        alert("שגיאה באישור קבלה");
      }
    } catch (err) {
      console.error("שגיאה באישור קבלה:", err);
    }
  };

  // Handle cancellation of a book reservation
  // This will make the book available for others
  const handleCancelReservation = async (bookId) => {
    if (!window.confirm("האם אתה בטוח שברצונך לבטל את השריון?")) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/reservedBooks/cancel/${bookId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        await fetchReservedBooks(); // Refresh the list after cancellation
      } else {
        alert("שגיאה בביטול השריון");
      }
    } catch (err) {
      console.error("שגיאה בביטול שריון:", err);
    }
  };

  // Navigate to chat screen with the book donor
  const handleChat = (donorId) => {
    navigate("/chat", { state: { selectedUserId: donorId } });
  };

  // Calculate and format the remaining time for a reservation
  // Returns a string showing hours and minutes left
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

  // Main component render
  // Displays a grid of reserved books with their details and actions
  return (
    <div className="md-container">
      <div className="search-page">
        <div className="md-card search-container">
          {/* Header section with title and count */}
          <div className="search-header">
            <span className="material-icons">library_books</span>
            <h1 className="md-text-xl">הספרים ששיריינתי</h1>
            {!loading && (
              <div className="search-results-count">
                {reservedBooks.length} ספרים משוריינים
              </div>
            )}
          </div>

          {/* Main content section */}
          <div className="search-results">
            {/* Loading state */}
            {loading ? (
              <div className="md-loading">
                <div className="md-loading-spinner" />
                <span>טוען ספרים...</span>
              </div>
            ) : reservedBooks.length > 0 ? (
              // Grid of reserved books
              <div className="books-grid">
                {reservedBooks.map((book) => (
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
                              <span className="book-card__value" style={{ color: '#10b981', fontWeight: 600 }}>
                                {book.username || "לא ידוע"}
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

                            {/* Subject information */}
                            <div className="book-card__detail-row">
                              <span className="book-card__label">תחום: </span>
                              <span className="book-card__value">
                                {book.subject || "לא ידוע"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Book condition and time remaining tags */}
                        <div className="book-card__tags">
                          <span className="book-card__condition-tag">
                            <span className="book-card__tag-label">מצב: </span>
                            {book.condition}
                          </span>
                        </div>
                        <div
                          className="book-card__tags"
                          style={{ marginTop: "8px" }}
                        >
                          <div className="book-card__detail-row">
                            <span className="book-card__label">
                              זמן שנותר:{" "}
                            </span>
                            <span
                              className="book-card__value"
                              style={{
                                fontWeight: 600,
                                color: "#363636",
                                fontStyle: "normal",
                              }}
                            >
                              {formatRemainingTime(book.reservedUntil)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons section */}
                      <div className="book-card__actions">
                        {/* Confirm pickup button */}
                        <button
                          className="book-card__button book-card__button--primary"
                          onClick={() => handleConfirmPickup(book._id)}
                        >
                          <span className="material-icons">check_circle</span>
                          אשר קבלה
                        </button>
                        {/* Cancel reservation button */}
                        <button
                          className="book-card__button book-card__button--secondary"
                          onClick={() => handleCancelReservation(book._id)}
                          style={{
                            background: "#ef4444",
                            color: "white",
                            borderColor: "#ef4444",
                          }}
                        >
                          <span className="material-icons">cancel</span>
                          בטל שריון
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
              // Empty state
              <div className="no-results">
                <span className="material-icons">inbox</span>
                <p>אין ספרים משוריינים</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .search-page {
          min-height: calc(100vh - 64px);
          background-color: #f5f5f5;
          padding: var(--spacing-xl) var(--spacing-md);
        }

        .search-container {
          background: white;
          padding: var(--spacing-xl);
          max-width: 1200px;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .search-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
          flex-wrap: wrap;
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid #eee;
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

        /* Book Cards Grid Layout */
        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--md-spacing-md);
          padding: var(--md-spacing-md);
        }

        .book-card {
          background: white;
          border: none;
          border-radius: 0;
          display: flex;
          position: relative;
          transition: all 0.2s ease;
          border-bottom: 1px solid #e8e8e8;
          padding: 16px;
          height: 100%;
        }

        .book-card__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          text-align: right;
          height: 100%;
        }

        .book-card__main-info {
          flex: 1;
        }

        .book-card__content-wrapper {
          display: flex;
          gap: 16px;
          margin: 12px 0;
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

        .book-card__actions {
          display: flex;
          gap: 8px;
          margin-top: auto;
          justify-content: flex-start;
        }

        .book-card__button {
          flex-shrink: 1;
          min-width: 90px;
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
            height: auto;
          }

          .book-card__content {
            height: auto;
          }

          .book-card__main-info {
            flex: none;
          }

          .book-card__actions {
            margin-top: 12px;
          }

          .book-card__button {
            min-width: unset;
          }
        }

        .book-card:hover {
          background: #f8fafc;
        }

        .book-card:first-child {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }

        .book-card:last-child {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border-bottom: none;
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

        .book-card__details {
          flex: 1;
        }

        .book-card__title {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #363636;
          line-height: 1.2;
        }

        .book-card__detail-row {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }

        .book-card__label {
          color: #999;
          font-size: 13px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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

        .book-card__tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .book-card__condition-tag,
        .book-card__time-tag {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .book-card__condition-tag {
          background: #f0f4ff;
          color: #3b82f6;
          border: 1px solid #e0e7ff;
          font-size: 13px;
        }

        .book-card__tag-label {
          color: inherit;
          font-weight: normal;
          font-size: inherit;
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

        .book-card__button .material-icons {
          font-size: 18px;
        }

        .book-card__button--primary {
          background: #10b981;
          color: white;
          font-weight: 600;
          border-color: #10b981;
        }

        .book-card__button--primary:hover {
          background: #059669;
          border-color: #059669;
        }

        .book-card__button--secondary {
          background: white;
          color: #4b5563;
          border-color: #e5e7eb;
        }

        .book-card__button--secondary:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        button.book-card__button--secondary[onclick*="handleCancelReservation"] {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          font-weight: 600;
        }

        button.book-card__button--secondary[onclick*="handleCancelReservation"]:hover {
          background: #dc2626;
          border-color: #dc2626;
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
            padding: 8px;
          }

          .book-card__content-wrapper {
            gap: 12px;
            margin: 8px 0;
          }

          .book-card__image-container {
            width: 100px;
            height: 100px;
          }

          .book-card__image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .book-card__title {
            font-size: 15px;
            margin-bottom: 8px;
          }

          .book-card__details {
            gap: 6px;
            margin-bottom: 8px;
          }

          .book-card__detail-row {
            font-size: 13px;
            margin-bottom: 4px;
          }

          .book-card__tags {
            gap: 6px;
          }

          .book-card__condition-tag,
          .book-card__time-tag {
            font-size: 11px;
            padding: 3px 6px;
          }

          .book-card__actions {
            gap: 6px;
            margin-top: 8px;
            flex-wrap: wrap;
          }

          .book-card__button {
            height: 34px;
            font-size: 12px;
            padding: 0 10px;
            min-width: 70px;
            flex: 1;
          }
        }

        @media (max-width: 375px) {
          .search-container {
            padding: 8px;
          }

          .book-card__content-wrapper {
            gap: 8px;
            margin: 6px 0;
          }

          .book-card__image-container {
            width: 80px;
            height: 80px;
          }

          .book-card__title {
            font-size: 14px;
          }

          .book-card__detail-row {
            font-size: 12px;
          }

          .book-card__button {
            height: 32px;
            font-size: 11px;
            padding: 0 8px;
            min-width: 65px;
          }
        }
      `}</style>
    </div>
  );
}
