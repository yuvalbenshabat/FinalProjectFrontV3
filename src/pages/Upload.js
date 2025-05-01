import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useUser } from "../context/UserContext";

const API_BASE = process.env.REACT_APP_API_BASE;

export default function Upload() {
  const { user } = useUser();
  const [book, setBook] = useState({
    title: "",
    author: "",
    grade: "",
    barcode: "",
    condition: ""
  });

  const [isApproved, setIsApproved] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scannerRef.current) return;

    scannerRef.current = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 300, height: 100 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanner.SCAN_TYPE_CAMERA]
    });

    scannerRef.current.render(
      (decodedText) => {
        handleBarcodeScanned(decodedText);
        scannerRef.current.clear();
      },
      (errorMessage) => {
        console.warn("שגיאת סריקה:", errorMessage);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const cleanScannedBarcode = (barcode) => {
    const noZeros = barcode.replace(/\s|-/g, "").replace(/0/g, "");
    return noZeros.length > 1 ? noZeros.slice(0, -1) : noZeros;
  };

  const handleBarcodeScanned = (rawBarcode) => {
    const cleaned = cleanScannedBarcode(rawBarcode);
    setBook((prev) => ({ ...prev, barcode: cleaned }));
    validateAndFillBook(cleaned);
  };

  const validateAndFillBook = async (cleanedBarcode) => {
    try {
      const res = await fetch(`${API_BASE}/api/books/barcode/${cleanedBarcode}`);
      const data = await res.json();

      if (res.ok && data) {
        setBook((prev) => ({
          ...prev,
          title: data.title || "",
          author: data.author || "",
          grade: data.grade || "",
          barcode: cleanedBarcode
        }));
        setIsApproved(true);
      } else {
        setIsApproved(false);
      }
    } catch (err) {
      console.error("שגיאה באימות מול השרת:", err);
      setIsApproved(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue = name === "barcode" ? cleanScannedBarcode(value) : value;
    setBook({ ...book, [name]: cleanedValue });
    if (name === "barcode") {
      validateAndFillBook(cleanedValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!book.condition) {
      alert("נא לבחור את מצב הספר");
      return;
    }

    if (!isApproved) {
      alert("⚠️ הספר לא מאושר על ידי משרד החינוך");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/donatedBooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          bookTitle: book.title,
          author: book.author,
          grade: book.grade,
          barcode: book.barcode,
          condition: book.condition
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ הספר נשלח ונשמר!");
        setBook({
          title: "",
          author: "",
          grade: "",
          barcode: "",
          condition: ""
        });
        setIsApproved(null);
      } else {
        alert("שגיאה: " + data.message);
      }
    } catch (err) {
      console.error("שגיאה בשליחה:", err);
      alert("שגיאה בעת שליחת הספר לשרת.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>העלאת ספר לתרומה</h2>
        <div id="qr-reader" style={styles.scanner}></div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label>שם הספר:
            <input type="text" name="title" value={book.title} onChange={handleChange} />
          </label>
          <label>מחבר:
            <input type="text" name="author" value={book.author} onChange={handleChange} />
          </label>
          <label>כיתה:
            <input type="text" name="grade" value={book.grade} onChange={handleChange} />
          </label>
          <label>ברקוד:
            <input type="text" name="barcode" value={book.barcode} onChange={handleChange} />
          </label>
          <label>מצב הספר:
            <select name="condition" value={book.condition} onChange={handleChange}>
              <option value="">בחר מצב</option>
              <option value="לא טוב">לא טוב</option>
              <option value="סביר">סביר</option>
              <option value="טוב">טוב</option>
            </select>
          </label>

          {isApproved === true && <p style={{ color: "green" }}>✅ הספר מאושר!</p>}
          {isApproved === false && <p style={{ color: "red" }}>❌ הספר לא נמצא ברשימת האישור</p>}

          <button type="submit" style={styles.button}>📤 שלח</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#e6ecff",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
    direction: "rtl",
    textAlign: "center"
  },
  title: {
    marginBottom: "20px",
    color: "#333"
  },
  scanner: {
    width: "100%",
    margin: "20px 0"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  button: {
    backgroundColor: "#f6c90e",
    color: "#000",
    fontWeight: "bold",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px"
  }
};
