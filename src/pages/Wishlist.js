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
  const [selectedBooks, setSelectedBooks] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [activeChildId, setActiveChildId] = useState(null);
  const [showSearchMenu, setShowSearchMenu] = useState(false);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  const activeChild = children.find((c) => c._id === activeChildId);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/books`)
      .then((res) => {
        setBookOptions(res.data);
      })
      .catch((err) => {
        console.error("שגיאה בטעינת ספרים:", err);
      });
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    axios
      .get(`${API_BASE}/api/children/${user._id}`)
      .then(async (res) => {
        const childrenWithWishlists = await Promise.all(
          res.data.map(async (child) => {
            const wishlistRes = await axios.get(
              `${API_BASE}/api/wishlist/${child._id}`
            );
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
    const book = bookOptions.find(
      (b) => b.title.toLowerCase() === selectedTitle.toLowerCase()
    );
    if (!book) {
      console.error("לא נמצא ספר עם הכותרת:", selectedTitle);
      return;
    }

    console.log("מוסיף ספר:", book);
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
        setShowSearchMenu(false);
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
                  wishlist: child.wishlist.filter(
                    (book) => book._id !== bookId
                  ),
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".add-child-dropdown") &&
        !event.target.closest(".child-selection")
      ) {
        setShowAddChildForm(false);
        setShowChildDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="md-container">
      <div className="wishlist-page">
        <div className="md-card wishlist-container">
          {/* Header */}
          <div className="wishlist-header">
            <span className="material-icons" style={{ color: "#008080" }}>
              list_alt
            </span>
            <h1 className="md-text-xl" style={{ color: "#008080" }}>
              רשימת ספרים חסרים
            </h1>
          </div>

          {/* Child Management Section */}
          <div className="child-management">
            {/* Add Child Form as Dropdown */}
            <div className="add-child-dropdown">
              <button
                className="add-child-button md-button md-button-primary"
                onClick={() => {
                  setShowAddChildForm(!showAddChildForm);
                  setShowChildDropdown(false); // סגירת dropdown אחר
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500",
                  fontFamily: "Arial, sans-serif",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(33, 150, 243, 0.3)",
                  minWidth: "180px",
                  height: "48px",
                }}
              >
                <span className="material-icons">add_circle</span>
                הוסף ילד
              </button>
              {showAddChildForm && (
                <div className="add-child-form-dropdown">
                  <div className="md-input-group">
                    <span className="material-icons md-input-icon">
                      person_add
                    </span>
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
                      {[
                        "א",
                        "ב",
                        "ג",
                        "ד",
                        "ה",
                        "ו",
                        "ז",
                        "ח",
                        "ט",
                        "י",
                        "יא",
                        "יב",
                      ].map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="md-button md-button-primary"
                    onClick={() => {
                      handleAddChild();
                      setShowAddChildForm(false);
                    }}
                    style={{
                      width: "100%",
                      marginTop: "12px",
                      padding: "10px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    <span className="material-icons">add</span>
                    הוסף
                  </button>
                </div>
              )}
            </div>

            {children.length > 0 && (
              <div className="child-selection">
                <div className="dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={() => {
                      setShowChildDropdown(!showChildDropdown);
                      setShowAddChildForm(false); // סגירת dropdown אחר
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "12px 20px",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "500",
                      fontFamily: "Arial, sans-serif",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 8px rgba(33, 150, 243, 0.3)",
                      minWidth: "180px",
                      height: "48px",
                    }}
                  >
                    {activeChild?.name || "בחר ילד"}
                    <span className="material-icons">
                      {showChildDropdown ? "arrow_drop_up" : "arrow_drop_down"}
                    </span>
                  </button>
                  {showChildDropdown && (
                    <div className="dropdown-menu">
                      {children.map((child) => (
                        <div
                          key={child._id}
                          className="dropdown-item"
                          onClick={() => {
                            setActiveChildId(child._id);
                            setShowChildDropdown(false);
                          }}
                        >
                          <span>
                            {child.name} - כיתה {child.grade}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Child Content */}
          {activeChild && (
            <div className="active-child-content">
              {/* Book Search */}
              <div className="book-search-section md-card">
                <div className="book-search-header">
                  <span className="material-icons">search</span>
                  <h3 className="md-text-lg">הוסף ספר לרשימה</h3>
                  {activeChild && (
                    <div className="grade-info">
                      {bookOptions.filter(
                        (book) => book.grade === activeChild.grade
                      ).length > 0
                        ? `זמינים ${
                            bookOptions.filter(
                              (book) => book.grade === activeChild.grade
                            ).length
                          } ספרים לכיתה ${activeChild.grade}`
                        : `אין ספרים זמינים לכיתה ${activeChild.grade}`}
                    </div>
                  )}
                </div>
                <div className="md-input-group">
                  <span className="material-icons md-input-icon">book</span>
                  <input
                    type="text"
                    className="md-input"
                    placeholder="חפש ספר..."
                    value={searchTerms[activeChild._id] || ""}
                    onChange={(e) => {
                      setSearchTerms({
                        ...searchTerms,
                        [activeChild._id]: e.target.value,
                      });
                      setShowSearchMenu(true);
                    }}
                  />
                </div>
                {searchTerms[activeChild._id] &&
                  showSearchMenu &&
                  bookOptions
                    .filter((book) => book.grade === activeChild?.grade)
                    .filter((book) =>
                      book.title
                        .toLowerCase()
                        .includes(
                          (searchTerms[activeChild._id] || "").toLowerCase()
                        )
                    ).length > 0 && (
                    <div className="book-options">
                      {bookOptions
                        .filter((book) => book.grade === activeChild?.grade)
                        .filter((book) =>
                          book.title
                            .toLowerCase()
                            .includes(
                              (searchTerms[activeChild._id] || "").toLowerCase()
                            )
                        )
                        .slice(0, 5)
                        .map((book, index) => (
                          <div
                            key={index}
                            className={`book-option ${
                              selectedBooks[activeChild._id] === book.title
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              console.log("נבחר ספר:", book.title);
                              setSelectedBooks({
                                ...selectedBooks,
                                [activeChild._id]: book.title,
                              });
                              setSearchTerms({
                                ...searchTerms,
                                [activeChild._id]: book.title,
                              });
                              setShowSearchMenu(false);
                            }}
                          >
                            <span className="material-icons">menu_book</span>
                            {book.title}
                            {book.author && (
                              <span className="book-author">
                                {" "}
                                - {book.author}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                <button
                  className="md-button md-button-primary"
                  onClick={() => handleAddBook(activeChild._id)}
                  disabled={!selectedBooks[activeChild._id]}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span className="material-icons">add</span>
                  הוסף ספר
                </button>
              </div>

              {/* Wishlist */}
              <div className="wishlist-books">
                <h3 className="md-text-lg">הספרים ברשימה</h3>
                <div className="books-grid">
                  {activeChild.wishlist.map((book) => (
                    <div
                      key={book._id}
                      className="md-card book-card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        padding: "var(--md-spacing-lg)",
                        flexGrow: 1,
                      }}
                    >
                      <div
                        className="book-info"
                        style={{
                          textAlign: "center",
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <h3 className="md-text-lg">{book.title}</h3>
                        <p>מחבר: {book.author}</p>
                      </div>
                      <div className="book-actions">
                        <button
                          className="md-button md-button-primary"
                          onClick={() =>
                            handleShowDonors(activeChild._id, book._id)
                          }
                          style={{
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "500",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            width: "100%",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            className="material-icons"
                            style={{ fontSize: "18px" }}
                          >
                            search
                          </span>
                          חפש תורמים
                        </button>
                        <button
                          className="md-button md-button-secondary"
                          onClick={() =>
                            handleRemoveBook(activeChild._id, book._id)
                          }
                          style={{
                            backgroundColor: "transparent",
                            color: "#10b981",
                            border: "1px solid #10b981",
                            padding: "10px 16px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: "500",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            width: "100%",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            className="material-icons"
                            style={{ fontSize: "18px" }}
                          >
                            delete
                          </span>
                          הסר מהרשימה
                        </button>
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
          overflow: visible !important;
        }

        .wishlist-container {
          padding: var(--md-spacing-xl);
          overflow: visible !important;
        }

        .wishlist-header {
          margin-top: 20px;
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
          gap: 20px;
          margin-bottom: 32px;
          align-items: flex-start;
          flex-wrap: wrap;
          position: relative;
          overflow: visible !important;
        }

        .add-child-dropdown {
          position: relative;
          display: inline-block;
          overflow: visible !important;
        }

        .add-child-button:hover {
          backgroundColor: #047857 !important;
          transform: translateY(-2px);
          boxShadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
        }

        .dropdown-toggle:hover {
          backgroundColor: #047857 !important;
          transform: translateY(-2px);
          boxShadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
        }

        .add-child-form-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          width: 320px;
          max-width: 90vw;
        }

        .md-input-group {
          position: relative;
          margin-bottom: 16px;
          width: 100%;
        }

        .md-input {
          width: 100%;
          padding: 12px 40px 12px 12px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
          direction: rtl;
        }

        .md-input:focus {
          outline: none;
          border-color: #10b981;
          background: white;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .md-input-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          pointer-events: none;
        }

        .md-input:focus + .md-input-icon {
          color: #10b981;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 4px;
          min-width: 200px;
          white-space: nowrap;
        }

        .dropdown-item {
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item:hover {
          background: #f8f9fa;
          color: #10b981;
          transform: translateX(4px);
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
          color: var(--primary);
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
          background-color: rgba(16, 185, 129, 0.04);
        }

        .book-option.selected {
          background-color: rgba(16, 185, 129, 0.1);
        }

        .book-option .material-icons {
          color: var(--primary);
          font-size: 20px;
        }

        .book-author {
          font-size: 0.85em;
          color: #666;
          font-style: italic;
        }

        .grade-info {
          font-size: 0.9em;
          color: #666;
          margin-top: 4px;
          padding: 4px 8px;
          background-color: #f0f8f0;
          border-radius: 4px;
          border-left: 3px solid #28a745;
        }

        .wishlist-books {
          margin-top: var(--md-spacing-xl);
        }

        .wishlist-books h3 {
          margin-bottom: var(--md-spacing-lg);
          color: var(--md-on-surface);
        }

        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--md-spacing-lg);
          justify-items: center;
        }

        .book-card {
          display: flex;
          flex-direction: column;
          padding: var(--md-spacing-lg);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: var(--md-radius-lg);
          background-color: #fff;
          min-height: 300px;
          width: 250px;
          height: 350px;
        }

        .book-image {
          position: relative;
          width: 100%;
          height: 150px;
          overflow: hidden;
          border-radius: var(--md-radius-lg);
        }

        .book-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .book-info {
          margin-top: var(--md-spacing-md);
          text-align: center;
        }

        .book-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--md-spacing-md);
          margin-top: auto;
          padding-top: var(--md-spacing-lg);
        }

        .add-book-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--md-spacing-lg);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: var(--md-radius-lg);
          background-color: #f0f0f0;
          cursor: pointer;
          transition: background-color var(--md-transition-fast);
          min-height: 300px;
          width: 250px;
          height: 350px;
        }

        .add-book-card:hover {
          background-color: #e0e0e0;
        }

        .add-book-icon {
          font-size: 48px;
          color: var(--primary);
        }

        .md-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .md-button-primary {
          background-color: var(--primary);
          color: white;
        }

        .md-button-primary:hover {
          background-color: var(--primary-dark);
          transform: translateY(-1px);
        }

        .md-button-secondary {
          background-color: transparent;
          color: var(--primary);
          border: 1px solid var(--primary);
        }

        .md-button-secondary:hover {
          background-color: transparent !important;
          color: #10b981 !important;
          border: 1px solid #10b981 !important;
        }

        .md-button-primary:hover {
          background-color: #047857 !important;
        }

        @media (max-width: 768px) {
          .wishlist-container {
            padding: var(--md-spacing-lg);
          }

          .book-actions {
            grid-template-columns: 1fr;
          }

          .child-management {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .add-child-button,
          .dropdown-toggle {
            width: 100%;
            justify-content: space-between;
          }

          .add-child-form-dropdown {
            position: absolute;
            right: 0;
            width: 280px;
          }

          .child-management {
            position: relative;
            width: 100%;
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

          .add-child-button,
          .dropdown-toggle {
            padding: 10px 16px;
            fontSize: 14px;
          }

          .add-child-form-dropdown {
            width: calc(100vw - 32px);
            right: -8px;
          }
        }
      `}</style>
    </div>
  );
}
