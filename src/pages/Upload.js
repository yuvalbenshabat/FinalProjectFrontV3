// 📁 /pages/Upload.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { useUser } from "../context/UserContext";
import "../styles/Upload.css";

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
  const alreadyScannedRef = useRef(false);

  const cleanScannedBarcode = (barcode) => {
    const noZeros = barcode.replace(/\s|-/g, "").replace(/0/g, "");
    return noZeros.length > 1 ? noZeros.slice(0, -1) : noZeros;
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

  const handleBarcodeScanned = useCallback(async (rawBarcode) => {
    if (alreadyScannedRef.current) return;
    alreadyScannedRef.current = true;

    const cleaned = cleanScannedBarcode(rawBarcode);
    setBook((prev) => ({ ...prev, barcode: cleaned }));
    await validateAndFillBook(cleaned);
  }, []);

  const startScanner = () => {
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 300, height: 100 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    });

    scanner.render(
      async (decodedText) => {
        try {
          await scanner.clear();
          scannerRef.current = null;
        } catch (err) {
          console.warn("❌ שגיאה בסגירת הסורק:", err);
        }

        await handleBarcodeScanned(decodedText);
      },
      (errorMessage) => {
        if (
          !errorMessage.includes("No MultiFormat Readers") &&
          !errorMessage.includes("parse error")
        ) {
          console.warn("⚠️ שגיאת סריקה:", errorMessage);
        }
      }
    );

    scannerRef.current = scanner;
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [handleBarcodeScanned]);

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
      alert("⚠ הספר לא מאושר על ידי משרד החינוך");
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
        alreadyScannedRef.current = false;
        startScanner();
      } else {
        alert("שגיאה: " + data.message);
      }
    } catch (err) {
      console.error("שגיאה בשליחה:", err);
      alert("שגיאה בעת שליחת הספר לשרת.");
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2 className="title">העלאת ספר לתרומה</h2>
        <div id="qr-reader" className="scanner"></div>

        <form onSubmit={handleSubmit} className="upload-form">
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

          {isApproved === true && <p className="status approved">✅ הספר מאושר!</p>}
          {isApproved === false && <p className="status rejected">❌ הספר לא נמצא ברשימת האישור</p>}

          <button type="submit" className="button-primary">📤 שלח</button>
        </form>
      </div>
    </div>
  );
}
