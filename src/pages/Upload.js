// Upload Component
// This component handles the donation of books through barcode scanning and manual input
// It validates books against an approved list and saves them to the database

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { useUser } from "../context/UserContext";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;

export default function Upload() {
  // Get current user data from context
  const { user } = useUser();
  
  // State for book details and UI
  const [book, setBook] = useState({
    title: "",
    author: "",
    grade: "",
    barcode: "",
    condition: ""
  });

  // State to track if book is approved by Ministry of Education
  const [isApproved, setIsApproved] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Refs for barcode scanner management
  const scannerRef = useRef(null);
  const alreadyScannedRef = useRef(false);

  // Clean barcode by removing spaces, dashes, and leading zeros
  const cleanScannedBarcode = (barcode) => {
    const noZeros = barcode.replace(/\s|-/g, "").replace(/0/g, "");
    return noZeros.length > 1 ? noZeros.slice(0, -1) : noZeros;
  };

  // Validate barcode against approved books and fill form
  const validateAndFillBook = async (cleanedBarcode) => {
    try {
      setIsLoading(true);
      setError("");
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
      setError("שגיאה באימות הספר מול השרת");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful barcode scan
  const handleBarcodeScanned = useCallback(async (rawBarcode) => {
    if (alreadyScannedRef.current) return;
    alreadyScannedRef.current = true;

    const cleaned = cleanScannedBarcode(rawBarcode);
    setBook((prev) => ({ ...prev, barcode: cleaned }));
    await validateAndFillBook(cleaned);
  }, []);

  // Initialize barcode scanner
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
          console.warn("שגיאה בסגירת הסורק:", err);
        }

        await handleBarcodeScanned(decodedText);
      },
      (errorMessage) => {
        if (
          !errorMessage.includes("No MultiFormat Readers") &&
          !errorMessage.includes("parse error")
        ) {
          console.warn("שגיאת סריקה:", errorMessage);
        }
      }
    );

    scannerRef.current = scanner;
  };

  // Initialize scanner on component mount
  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [handleBarcodeScanned]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue = name === "barcode" ? cleanScannedBarcode(value) : value;
    setBook({ ...book, [name]: cleanedValue });

    if (name === "barcode") {
      validateAndFillBook(cleanedValue);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!book.condition) {
      setError("נא לבחור את מצב הספר");
      return;
    }

    if (!isApproved) {
      setError("הספר לא מאושר על ידי משרד החינוך");
      return;
    }

    try {
      setIsLoading(true);
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
        throw new Error(data.message || "שגיאה בשליחת הספר");
      }
    } catch (err) {
      console.error("שגיאה בשליחה:", err);
      setError(err.message || "שגיאה בעת שליחת הספר לשרת");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="container">
        <div className="upload-card card elevation-1">
          <div className="upload-header">
            <span className="material-icons">upload_file</span>
            <h1>העלאת ספר לתרומה</h1>
          </div>

          {error && (
            <div className="error">
              <span className="material-icons">error</span>
              {error}
            </div>
          )}

          {/* Barcode scanner container */}
          <div className="scanner-container card elevation-1">
            <div className="scanner-header">
              <span className="material-icons">qr_code_scanner</span>
              <h3>סריקת ברקוד</h3>
            </div>
            <div id="qr-reader" className="scanner"></div>
          </div>

          {/* Book donation form */}
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="input-group">
              <span className="material-icons input-icon">book</span>
              <input
                type="text"
                name="title"
                className="input-field"
                placeholder="שם הספר"
                value={book.title}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <span className="material-icons input-icon">person</span>
              <input
                type="text"
                name="author"
                className="input-field"
                placeholder="מחבר"
                value={book.author}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <span className="material-icons input-icon">school</span>
              <input
                type="text"
                name="grade"
                className="input-field"
                placeholder="כיתה"
                value={book.grade}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <span className="material-icons input-icon">qr_code</span>
              <input
                type="text"
                name="barcode"
                className="input-field"
                placeholder="ברקוד"
                value={book.barcode}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <span className="material-icons input-icon">star_rate</span>
              <select
                name="condition"
                className="input-field"
                value={book.condition}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="">בחר מצב</option>
                <option value="לא טוב">לא טוב</option>
                <option value="סביר">סביר</option>
                <option value="טוב">טוב</option>
              </select>
            </div>

            {/* Approval status messages */}
            {isApproved === true && (
              <div className="success">
                <span className="material-icons">check_circle</span>
                הספר מאושר!
              </div>
            )}
            {isApproved === false && (
              <div className="error">
                <span className="material-icons">error</span>
                הספר לא נמצא ברשימת האישור
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="button button-primary"
              disabled={isLoading || !isApproved}
            >
              {isLoading ? (
                <div className="button-loading">
                  <span className="material-icons spinning">refresh</span>
                  שולח...
                </div>
              ) : (
                <>
                  <span className="material-icons">upload</span>
                  שלח
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .upload-page {
          min-height: calc(100vh - 64px);
          background-color: var(--surface);
          padding: var(--spacing-xl) var(--spacing-md);
        }

        .upload-card {
          background: var(--background);
          padding: var(--spacing-xl);
        }

        .upload-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .upload-header .material-icons {
          font-size: 32px;
          color: var(--primary);
        }

        .upload-header h1 {
          margin: 0;
          color: var(--text-primary);
        }

        .scanner-container {
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-lg);
          background: var(--surface);
        }

        .scanner-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .scanner-header .material-icons {
          color: var(--primary);
        }

        .scanner-header h3 {
          margin: 0;
          color: var(--text-primary);
        }

        .scanner {
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .upload-form {
          display: grid;
          gap: var(--spacing-md);
        }

        .button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .upload-page {
            padding: var(--spacing-md);
          }

          .upload-card {
            padding: var(--spacing-lg);
          }
        }

        /* Override scanner styles */
        #qr-reader {
          width: 100% !important;
          border: none !important;
          background: var(--background) !important;
        }

        #qr-reader__scan_region {
          background: var(--background) !important;
        }

        #qr-reader__scan_region img {
          width: 100% !important;
          height: auto !important;
        }

        #qr-reader__dashboard {
          padding: var(--spacing-md) !important;
          background: var(--background) !important;
        }

        #qr-reader__dashboard button {
          padding: var(--spacing-sm) var(--spacing-md) !important;
          border-radius: var(--radius-full) !important;
          background: var(--primary) !important;
          color: white !important;
          border: none !important;
          cursor: pointer !important;
          font-family: var(--font-family) !important;
          font-size: var(--font-size-sm) !important;
          transition: background-color var(--transition-fast) !important;
        }

        #qr-reader__dashboard button:hover {
          background: var(--primary-dark) !important;
        }

        #qr-reader__dashboard select {
          padding: var(--spacing-sm) !important;
          border-radius: var(--radius-sm) !important;
          border: 1px solid var(--border-color) !important;
          font-family: var(--font-family) !important;
          font-size: var(--font-size-sm) !important;
        }
      `}</style>
    </div>
  );
}
