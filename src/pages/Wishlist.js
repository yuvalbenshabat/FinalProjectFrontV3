// Wishlist.js
import React, { useState } from "react";
import "../styles/Wishlist.css";

export default function Wishlist() {
  const [children, setChildren] = useState([
    {
      id: 1,
      name: "שקד",
      wishlist: [
        {
          id: 1,
          title: "חגיגה בצלילים",
          author: "ש. גולדשטיין",
        },
        {
          id: 2,
          title: "קסם החלילית",
          author: "ר. כהן",
        },
      ],
    },
    {
      id: 2,
      name: "נועה",
      wishlist: [
        {
          id: 1,
          title: "צלילי המוזיקה",
          author: "א. ברק",
        },
        {
          id: 2,
          title: "הרפתקאות הצליל",
          author: "ד. לוי",
        },
      ],
    },
  ]);

  const [newChildName, setNewChildName] = useState("");
  const [bookOptions] = useState([
    { barcode: "101", title: "מנגינה מתגלגלת", author: "ש. כהן" },
    { barcode: "102", title: "קסם הצלילים", author: "ל. לוי" },
    { barcode: "103", title: "צליל ועוד צליל", author: "י. ישראלי" },
  ]);

  const [selectedBooks, setSelectedBooks] = useState({});
  const [openDonors, setOpenDonors] = useState({});

  const handleShowDonors = (childId, bookId) => {
    const key = `${childId}-${bookId}`;
    setOpenDonors((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddChild = () => {
    if (!newChildName.trim()) return;
    const newChild = {
      id: Date.now(),
      name: newChildName,
      wishlist: [],
    };
    setChildren([...children, newChild]);
    setNewChildName("");
  };

  const handleAddBook = (childId) => {
    const selected = selectedBooks[childId];
    const bookData = bookOptions.find((b) => b.barcode === selected);
    if (!bookData) return;

    setChildren((prev) =>
      prev.map((child) =>
        child.id === childId
          ? {
              ...child,
              wishlist: [
                ...child.wishlist,
                {
                  id: Date.now(),
                  title: bookData.title,
                  author: bookData.author,
                },
              ],
            }
          : child
      )
    );
    setSelectedBooks({ ...selectedBooks, [childId]: "" });
  };

  const handleRemoveBook = (childId, bookId) => {
    setChildren((prev) =>
      prev.map((child) =>
        child.id === childId
          ? {
              ...child,
              wishlist: child.wishlist.filter((book) => book.id !== bookId),
            }
          : child
      )
    );
  };

  const mockDonors = ["משה ממרכז", "דינה מצפון", "אבי מירושלים"];

  return (
    <div className="wishlist-container">
      <h2 className="wishlist-title">📚 רשימת ספרים חסרים</h2>

      <div className="add-child-form">
        <input
          type="text"
          placeholder="שם הילד"
          value={newChildName}
          onChange={(e) => setNewChildName(e.target.value)}
        />
        <button onClick={handleAddChild}>➕ הוסף ילד</button>
      </div>

      <div className="children-grid">
        {children.map((child) => (
          <div key={child.id} className="child-card">
            <h3 className="child-name">{child.name}</h3>

            <div className="books-grid">
              {child.wishlist.map((book) => {
                const key = `${child.id}-${book.id}`;
                return (
                  <div key={book.id} className="book-card">
                    <div className="book-info">
                      <p className="book-title">{book.title}</p>
                      <p className="book-author">✍️ {book.author}</p>
                    </div>
                    <div className="book-actions">
                      <button
                        className="donors-button"
                        onClick={() => handleShowDonors(child.id, book.id)}
                      >
                        {openDonors[key] ? "הסתר תורמים" : "הצג תורמים"}
                      </button>
                      <button
                        className="remove-button"
                        onClick={() => handleRemoveBook(child.id, book.id)}
                      >
                        📦 הסר
                      </button>
                    </div>
                    {openDonors[key] && (
                      <div className="donor-list">
                        <strong>תורמים:</strong>
                        <ul>
                          {mockDonors.map((donor, index) => (
                            <li key={index}>{donor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="book-selector">
              <select
                value={selectedBooks[child.id] || ""}
                onChange={(e) =>
                  setSelectedBooks({ ...selectedBooks, [child.id]: e.target.value })
                }
              >
                <option value="">בחר ספר להוספה</option>
                {bookOptions.map((book) => (
                  <option key={book.barcode} value={book.barcode}>
                    {book.title} - {book.author}
                  </option>
                ))}
              </select>
              <button onClick={() => handleAddBook(child.id)}>הוסף</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
