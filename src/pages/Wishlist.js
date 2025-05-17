import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import "../styles/Wishlist.css";
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
    <div className="wishlist-container">
      <h2 className="wishlist-title">רשימת ספרים חסרים</h2>

      <div className="add-child-form">
        <input
          type="text"
          placeholder="שם הילד"
          value={newChildName}
          onChange={(e) => setNewChildName(e.target.value)}
        />
        <select
          value={newChildGrade}
          onChange={(e) => setNewChildGrade(e.target.value)}
        >
          <option value="">בחר כיתה</option>
          {["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"].map((grade) => (
            <option key={grade} value={grade}>
              כיתה {grade}
            </option>
          ))}
        </select>
        <button onClick={handleAddChild}>הוסף ילד</button>
      </div>

      {children.length > 0 && (
        <div className="child-selector">
          <select
            value={activeChildId || ""}
            onChange={(e) => setActiveChildId(e.target.value)}
          >
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name} (כיתה {child.grade})
              </option>
            ))}
          </select>
        </div>
      )}

      {activeChild && (
        <div className="child-card">
          <h3 className="child-name">
            {activeChild.name} <span className="grade">({activeChild.grade})</span>
          </h3>

          <div className="books-grid">
            {activeChild.wishlist.map((book) => (
              <div key={book._id} className="book-card">
                <div className="book-info">
                  <p className="book-title">{book.title}</p>
                  <p className="book-author">{book.author}</p>
                </div>
                <div className="book-actions">
                  <button
                    className="donors-button"
                    onClick={() => handleShowDonors(activeChild._id, book._id)}
                  >
                    הצג תורמים
                  </button>
                  <button
                    className="remove-button"
                    onClick={() => handleRemoveBook(activeChild._id, book._id)}
                  >
                    הסר
                  </button>
                </div>
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="חפש לפי שם..."
            value={searchTerms[activeChild._id] || ""}
            onChange={(e) =>
              setSearchTerms({
                ...searchTerms,
                [activeChild._id]: e.target.value,
              })
            }
          />

          <div className="book-selector">
            <select
              value={selectedBooks[activeChild._id] || ""}
              onChange={(e) =>
                setSelectedBooks({
                  ...selectedBooks,
                  [activeChild._id]: e.target.value,
                })
              }
            >
              {booksLoading ? (
                <option>טוען ספרים...</option>
              ) : (
                <>
                  <option value="">בחר ספר להוספה</option>
                  {bookOptions
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
                </>
              )}
            </select>
            <button onClick={() => handleAddBook(activeChild._id)}>הוסף</button>
          </div>
        </div>
      )}
    </div>
  );
}
