import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";

const API_BASE = process.env.REACT_APP_API_BASE;

export default function Wishlist() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [children, setChildren] = useState([]);
  const [newChildName, setNewChildName] = useState("");
  const [newChildGrade, setNewChildGrade] = useState("");
  const [bookOptions, setBookOptions] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [activeChildId, setActiveChildId] = useState(null);

  const activeChild = children.find((c) => c._id === activeChildId);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/books`)
      .then((res) => {
        setBookOptions(res.data);
        setBooksLoading(false);
      })
      .catch((err) => {
        console.error("שגיאה בטעינת ספרים:", err);
        setBooksLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    axios
      .get(`${API_BASE}/api/children/${user._id}`)
      .then(async (res) => {
        const childrenWithWishlists = await Promise.all(
          res.data.map(async (child) => {
            const wishlistRes = await axios.get(`${API_BASE}/api/wishlist/${child._id}`);
            return { ...child, wishlist: wishlistRes.data };
          })
        );
        setChildren(childrenWithWishlists);
        if (childrenWithWishlists.length > 0) {
          setActiveChildId(childrenWithWishlists[0]._id);
        }
      })
      .catch((err) => console.error("שגיאה בטעינת ילדים:", err));
  }, [user]);

  const handleAddChild = () => {
    if (!newChildName.trim() || !newChildGrade.trim()) return;

    axios
      .post(`${API_BASE}/api/children`, {
        name: newChildName,
        grade: newChildGrade,
        userId: user._id,
      })
      .then((res) => {
        const newChild = { ...res.data, wishlist: [] };
        setChildren([...children, newChild]);
        setNewChildName("");
        setNewChildGrade("");
        setActiveChildId(newChild._id);
      })
      .catch((err) => console.error("שגיאה בהוספת ילד:", err));
  };

  const handleAddBook = (childId) => {
    const selectedTitle = selectedBooks[childId];
    const book = bookOptions.find((b) => b.title === selectedTitle);
    if (!book) return;

    axios
      .post(`${API_BASE}/api/wishlist`, {
        childId,
        title: book.title,
        author: book.author,
      })
      .then((res) => {
        setChildren((prev) =>
          prev.map((child) =>
            child._id === childId
              ? { ...child, wishlist: [...child.wishlist, res.data] }
              : child
          )
        );
        setSelectedBooks({ ...selectedBooks, [childId]: "" });
      })
      .catch((err) => console.error("שגיאה בהוספת ספר:", err));
  };

  const handleRemoveBook = (childId, bookId) => {
    axios
      .delete(`${API_BASE}/api/wishlist/${bookId}`)
      .then(() => {
        setChildren((prev) =>
          prev.map((child) =>
            child._id === childId
              ? {
                  ...child,
                  wishlist: child.wishlist.filter((book) => book._id !== bookId),
                }
              : child
          )
        );
      })
      .catch((err) => console.error("שגיאה במחיקת ספר:", err));
  };

  const handleShowDonors = (childId, bookId) => {
    const child = children.find((c) => c._id === childId);
    const book = child?.wishlist.find((b) => b._id === bookId);

    if (book && child) {
      navigate("/search", {
        state: {
          title: book.title,
          grade: child.grade,
        },
      });
    }
  };

  return (
    <div className="md-container">
      <div className="wishlist-page">
        <div className="md-card wishlist-container">
          {/* Header */}
          <div className="wishlist-header">
            <span className="material-icons">list_alt</span>
            <h1 className="md-text-xl">רשימת ספרים חסרים</h1>
          </div>

          {/* Child Management Section */}
          <div className="child-management">
            {children.length > 0 && (
              <div className="md-input-group">
                <span className="material-icons md-input-icon">person</span>
                <select
                  className="md-input"
                  value={activeChildId || ""}
                  onChange={(e) => setActiveChildId(e.target.value)}
                >
                  <option value="">בחר ילד</option>
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.name} - כיתה {child.grade}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Add Child Form */}
            <details className="add-child-section md-card">
              <summary className="add-child-toggle">
                <span className="material-icons">add_circle</span>
                הוסף ילד
              </summary>
              <div className="add-child-form">
                <div className="md-input-group">
                  <span className="material-icons md-input-icon">person_add</span>
                  <input
                    type="text"
                    className="md-input"
                    placeholder="שם הילד"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                  />
                </div>
                <div className="md-input-group">
                  <span className="material-icons md-input-icon">school</span>
                  <select
                    className="md-input"
                    value={newChildGrade}
                    onChange={(e) => setNewChildGrade(e.target.value)}
                  >
                    <option value="">כיתה</option>
                    {["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"].map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  className="md-button md-button-primary"
                  onClick={handleAddChild}
                >
                  <span className="material-icons">add</span>
                  הוסף
                </button>
              </div>
            </details>
          </div>

          {/* Active Child Content */}
          {activeChild && (
            <div className="active-child-content">
              {/* Book Search */}
              <div className="book-search-section md-card">
                <div className="book-search-header">
                  <span className="material-icons">search</span>
                  <h3 className="md-text-lg">הוסף ספר לרשימה</h3>
                </div>
                <div className="md-input-group">
                  <span className="material-icons md-input-icon">book</span>
                  <input
                    type="text"
                    className="md-input"
                    placeholder="חפש ספר..."
                    value={searchTerms[activeChild._id] || ""}
                    onChange={(e) =>
                      setSearchTerms({
                        ...searchTerms,
                        [activeChild._id]: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="book-options">
                  {bookOptions
                    .filter((book) =>
                      book.title
                        .toLowerCase()
                        .includes((searchTerms[activeChild._id] || "").toLowerCase())
                    )
                    .slice(0, 5)
                    .map((book) => (
                      <div
                        key={book._id}
                        className="book-option"
                        onClick={() =>
                          setSelectedBooks({
                            ...selectedBooks,
                            [activeChild._id]: book.title,
                          })
                        }
                      >
                        <span className="material-icons">menu_book</span>
                        {book.title}
                      </div>
                    ))}
                </div>
                <button
                  className="md-button md-button-primary"
                  onClick={() => handleAddBook(activeChild._id)}
                  disabled={!selectedBooks[activeChild._id]}
                >
                  <span className="material-icons">add</span>
                  הוסף ספר
                </button>
              </div>

              {/* Wishlist */}
              <div className="wishlist-books">
                <h3 className="md-text-lg">הספרים ברשימה</h3>
                <div className="md-grid books-grid">
                  {activeChild.wishlist.map((book) => (
                    <div key={book._id} className="md-card book-card">
                      <div className="book-header">
                        <span className="material-icons book-icon">menu_book</span>
                        <h3 className="md-text-lg">{book.title}</h3>
                      </div>
                      <div className="book-content">
                        <div className="book-info">
                          <div className="info-row">
                            <span className="material-icons">person</span>
                            <span>מחבר: <strong>{book.author}</strong></span>
                          </div>
                        </div>
                        <div className="book-actions">
                          <button
                            className="md-button md-button-primary"
                            onClick={() => handleShowDonors(activeChild._id, book._id)}
                          >
                            <span className="material-icons">search</span>
                            חפש תורמים
                          </button>
                          <button
                            className="md-button md-button-secondary"
                            onClick={() => handleRemoveBook(activeChild._id, book._id)}
                          >
                            <span className="material-icons">delete</span>
                            הסר מהרשימה
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .wishlist-page {
          padding: var(--md-spacing-xl) 0;
          min-height: calc(100vh - 64px);
        }

        .wishlist-container {
          padding: var(--md-spacing-xl);
        }

        .wishlist-header {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-md);
          margin-bottom: var(--md-spacing-xl);
        }

        .wishlist-header .material-icons {
          font-size: 32px;
          color: var(--md-primary);
        }

        .wishlist-header h1 {
          margin: 0;
          font-weight: var(--md-font-weight-medium);
        }

        .child-management {
          display: flex;
          flex-direction: column;
          gap: var(--md-spacing-lg);
          margin-bottom: var(--md-spacing-xl);
        }

        .add-child-section {
          border: 1px solid var(--md-outline);
          border-radius: var(--md-radius-lg);
          overflow: hidden;
        }

        .add-child-toggle {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-sm);
          padding: var(--md-spacing-md);
          cursor: pointer;
          user-select: none;
          color: var(--md-primary);
          font-weight: var(--md-font-weight-medium);
        }

        .add-child-toggle::-webkit-details-marker {
          display: none;
        }

        .add-child-form {
          padding: var(--md-spacing-lg);
          border-top: 1px solid var(--md-outline);
          display: flex;
          flex-direction: column;
          gap: var(--md-spacing-md);
        }

        .book-search-section {
          margin-bottom: var(--md-spacing-xl);
          padding: var(--md-spacing-lg);
        }

        .book-search-header {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-md);
          margin-bottom: var(--md-spacing-lg);
        }

        .book-search-header .material-icons {
          color: var(--md-primary);
        }

        .book-options {
          margin: var(--md-spacing-md) 0;
        }

        .book-option {
          display: flex;
          align-items: center;
          gap: var(--md-spacing-sm);
          padding: var(--md-spacing-sm) var(--md-spacing-md);
          cursor: pointer;
          border-radius: var(--md-radius-sm);
          transition: background-color var(--md-transition-fast);
        }

        .book-option:hover {
          background-color: rgba(26, 115, 232, 0.04);
        }

        .book-option .material-icons {
          color: var(--md-primary);
          font-size: 20px;
        }

        .wishlist-books {
          margin-top: var(--md-spacing-xl);
        }

        .wishlist-books h3 {
          margin-bottom: var(--md-spacing-lg);
          color: var(--md-on-surface);
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

        .book-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--md-spacing-md);
          margin-top: auto;
          padding-top: var(--md-spacing-lg);
        }

        @media (max-width: 768px) {
          .wishlist-container {
            padding: var(--md-spacing-lg);
          }

          .book-actions {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .wishlist-container {
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

