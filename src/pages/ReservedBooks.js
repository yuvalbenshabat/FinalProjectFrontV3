// 📁 נתיב: /pages/ReservedBooks.js
// Reserved Books Component
// This component displays and manages books that the current user has reserved
// It allows users to confirm pickup, cancel reservations, and chat with donors

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;

export default function ReservedBooks() {
  // Get current user data and navigation function
  const { user } = useUser();
  const navigate = useNavigate();
  
  // State for reserved books and loading status
  const [reservedBooks, setReservedBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's reserved books from the server
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

  // Load reserved books when component mounts or user changes
  useEffect(() => {
    fetchReservedBooks();
  }, [user]);

  // Handle confirmation of book pickup
  const handleConfirmPickup = async (bookId) => {
    if (!window.confirm("האם אתה בטוח שהספר נמסר בהצלחה?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/reservedBooks/confirm/${bookId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchReservedBooks();  // Refresh the list after confirmation
      } else {
        alert("שגיאה באישור קבלה");
      }
    } catch (err) {
      console.error("שגיאה באישור קבלה:", err);
    }
  };

  // Handle cancellation of book reservation
  const handleCancelReservation = async (bookId) => {
    if (!window.confirm("האם אתה בטוח שברצונך לבטל את השריון?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/reservedBooks/cancel/${bookId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await fetchReservedBooks();  // Refresh the list after cancellation
      } else {
        alert("שגיאה בביטול השריון");
      }
    } catch (err) {
      console.error("שגיאה בביטול שריון:", err);
    }
  };

  // Navigate to chat with book donor
  const handleChat = (donorId) => {
    navigate("/chat", { state: { selectedUserId: donorId } });
  };

  // Calculate and format remaining time for reservation
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
    <div className="md-container">
      <div className="reserved-books-page">
        <div className="md-card reserved-books-container">
          {/* Header */}
          <div className="reserved-books-header">
            <span className="material-icons">library_books</span>
            <h1 className="md-text-xl">הספרים ששיריינתי</h1>
          </div>

          {/* Books List */}
          <div className="reserved-books-content">
            {loading ? (
              <div className="md-loading">
                <div className="md-loading-spinner" />
                <span>טוען ספרים...</span>
              </div>
            ) : reservedBooks.length > 0 ? (
              <div className="md-grid books-grid">
                {reservedBooks.map((book) => (
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

                        <div className="info-row time-remaining">
                          <span className="material-icons">schedule</span>
                          <span>זמן שנותר: <strong>{formatRemainingTime(book.reservedUntil)}</strong></span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="book-actions">
                        <button
                          className="md-button md-button-primary"
                          onClick={() => handleConfirmPickup(book._id)}
                        >
                          <span className="material-icons">check_circle</span>
                          אשר קבלה
                        </button>
                        <button
                          className="md-button md-button-secondary"
                          onClick={() => handleCancelReservation(book._id)}
                        >
                          <span className="material-icons">cancel</span>
                          בטל שריון
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
                <span className="material-icons">inbox</span>
                <p>אין ספרים משוריינים</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .reserved-books-page {
          padding: var(--md-spacing-xl) 0;
          min-height: calc(100vh - 64px);
        }

        .reserved-books-container {
          padding: var(--md-spacing-xl);
        }

        .reserved-books-header {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-md);
          margin-bottom: var(--md-spacing-xl);
        }

        .reserved-books-header .material-icons {
          font-size: 32px;
          color: var(--md-primary);
        }

        .reserved-books-header h1 {
          margin: 0;
          font-weight: var(--md-font-weight-medium);
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

        .book-info {
          display: flex;
          flex-direction: column;
          gap: var(--md-spacing-sm);
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

        .time-remaining {
          margin-top: var(--md-spacing-sm);
          padding-top: var(--md-spacing-sm);
          border-top: 1px solid var(--md-outline);
        }

        .book-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
          .reserved-books-container {
            padding: var(--md-spacing-lg);
          }

          .book-actions {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .reserved-books-container {
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
