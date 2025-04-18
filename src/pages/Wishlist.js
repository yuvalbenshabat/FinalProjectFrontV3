import React, { useState } from "react";

export default function Wishlist() {
  const [children, setChildren] = useState([]);
  const [childName, setChildName] = useState("");
  const [newBook, setNewBook] = useState({ title: "", grade: "", childId: null });

  const addChild = () => {
    if (childName.trim()) {
      const newChild = {
        id: Date.now(),
        name: childName,
        wishlist: [],
      };
      setChildren([...children, newChild]);
      setChildName("");
    }
  };

  const addBookToChild = (childId) => {
    if (newBook.title.trim() && newBook.grade.trim()) {
      setChildren((prevChildren) =>
        prevChildren.map((child) =>
          child.id === childId
            ? {
                ...child,
                wishlist: [
                  ...child.wishlist,
                  { id: Date.now(), title: newBook.title, grade: newBook.grade },
                ],
              }
            : child
        )
      );
      setNewBook({ title: "", grade: "", childId: null });
    }
  };

  const handleBookClick = (book) => {
    alert(`הצגת רשימת תורמים לספר "${book.title}" לפי מיקום גאוגרפי - יתממש בעתיד`);
    // future: navigate to donor list for this book
  };

  return (
    <div>
      <h2>📚 רשימת ספרים חסרים לפי ילדים</h2>

      <div>
        <input
          type="text"
          placeholder="שם הילד"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
        />
        <button onClick={addChild}>➕ הוסף ילד</button>
      </div>

      {children.map((child) => (
        <div key={child.id} style={{ border: "1px solid #ccc", marginTop: 10, padding: 10 }}>
          <h3>📌 {child.name}</h3>

          <ul>
            {child.wishlist.map((book) => (
              <li key={book.id} onClick={() => handleBookClick(book)} style={{ cursor: "pointer" }}>
                <strong>{book.title}</strong> - {book.grade}
              </li>
            ))}
          </ul>

          <div>
            <input
              type="text"
              placeholder="שם הספר"
              value={newBook.childId === child.id ? newBook.title : ""}
              onChange={(e) =>
                setNewBook({ ...newBook, title: e.target.value, childId: child.id })
              }
            />
            <input
              type="text"
              placeholder="שכבה"
              value={newBook.childId === child.id ? newBook.grade : ""}
              onChange={(e) =>
                setNewBook({ ...newBook, grade: e.target.value, childId: child.id })
              }
            />
            <button onClick={() => addBookToChild(child.id)}>➕ הוסף ספר</button>
          </div>
        </div>
      ))}
    </div>
  );
}
