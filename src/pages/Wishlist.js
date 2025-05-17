import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import "../styles/components.css";
import { useNavigate } from "react-router-dom";

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
    <div className="page-container">
      <div className="wishlist-content">
        <div className="wishlist-card">
          <h2 className="wishlist-title">📚 רשימת ספרים חסרים</h2>

          {/* Child Management Section */}
          <div className="child-management">
            {/* Child Selector - Always Visible */}
            {children.length > 0 && (
              <div className="child-selector">
                <select
                  className="wishlist-select primary"
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

            {/* Add Child Button - Compact */}
            <details className="add-child-section">
              <summary className="add-child-toggle">
                <span className="add-icon">+</span> הוסף ילד
              </summary>
              <div className="add-child-form">
                <div className="input-group compact">
                  <input
                    type="text"
                    className="wishlist-input"
                    placeholder="שם הילד"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                  />
                  <select
                    className="wishlist-input"
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
                  <button 
                    className="wishlist-button compact"
                    onClick={handleAddChild}
                  >
                    הוסף
                  </button>
                </div>
              </div>
            </details>
          </div>

          {/* Active Child Content */}
          {activeChild && (
            <div className="active-child-content">
              {/* Book Search - Compact Design */}
              <div className="book-search-section compact">
                <div className="search-bar">
                  <input
                    type="text"
                    className="wishlist-input search-input"
                    placeholder="🔍 חפש ספר..."
                    value={searchTerms[activeChild._id] || ""}
                    onChange={(e) =>
                      setSearchTerms({
                        ...searchTerms,
                        [activeChild._id]: e.target.value,
                      })
                    }
                  />
                </div>
                
                <div className="book-add-controls compact">
                  <select
                    className="wishlist-select book-select"
                    value={selectedBooks[activeChild._id] || ""}
                    onChange={(e) =>
                      setSelectedBooks({
                        ...selectedBooks,
                        [activeChild._id]: e.target.value,
                      })
                    }
                  >
                    <option value="">בחר ספר</option>
                    {!booksLoading && bookOptions
                      .filter(
                        (book) =>
                          book.grade === activeChild.grade &&
                          (!searchTerms[activeChild._id] ||
                            book.title
                              .toLowerCase()
                              .includes(searchTerms[activeChild._id].toLowerCase()))
                      )
                      .map((book) => (
                        <option key={book._id} value={book.title}>
                          {book.title} - {book.author}
                        </option>
                      ))}
                  </select>
                  <button 
                    className="wishlist-button add-button"
                    onClick={() => handleAddBook(activeChild._id)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Wishlist Books - Grid Layout */}
              <div className="wishlist-books-grid">
                {activeChild.wishlist.map((book) => (
                  <div key={book._id} className="book-card">
                    <div className="book-info">
                      <h4>{book.title}</h4>
                      <p>{book.author}</p>
                    </div>
                    <div className="book-actions">
                      <button
                        className="action-button find"
                        onClick={() => handleShowDonors(activeChild._id, book._id)}
                      >
                        חפש תורמים
                      </button>
                      <button
                        className="action-button remove"
                        onClick={() => handleRemoveBook(activeChild._id, book._id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {activeChild.wishlist.length === 0 && (
                  <div className="empty-state">
                    <p>אין ספרים ברשימה עדיין</p>
                    <p>הוסף ספרים מהרשימה למעלה</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!activeChild && children.length > 0 && (
            <div className="select-child-prompt">
              <p>בחר ילד מהרשימה למעלה כדי לראות ולערוך את רשימת הספרים שלו</p>
            </div>
          )}

          {children.length === 0 && (
            <div className="empty-state">
              <p>אין ילדים ברשימה</p>
              <p>התחל על ידי הוספת ילד חדש</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

