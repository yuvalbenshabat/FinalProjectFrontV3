// Upload Component
// This component handles the donation of books through barcode scanning and manual input
// It validates books against an approved list and saves them to the database

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { useUser } from "../context/UserContext";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;
const CLOUD_NAME = "dbwqqzzb2";
const UPLOAD_PRESET = "books_preset";

export default function Upload() {
  // Get current user data from context
  const { user } = useUser();

  // State for book details and UI
  const [book, setBook] = useState({
    title: "",
    author: "",
    grade: "",
    barcode: "",
    condition: "",
  });

  // State to track if book is approved by Ministry of Education
  const [isApproved, setIsApproved] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Refs for barcode scanner management
  const scannerRef = useRef(null);
  const alreadyScannedRef = useRef(false);

  // Clean barcode by removing spaces, dashes, and leading zeros
  const cleanScannedBarcode = (barcode) => {
    const noZeros = barcode.replace(/\s|-/g, "").replace(/0/g, "");
    return noZeros.length > 1 ? noZeros.slice(0, -1) : noZeros;
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

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
      const imgUrl = await uploadImageToCloudinary();
      const response = await fetch(`${API_BASE}/api/donatedBooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          bookTitle: book.title,
          author: book.author,
          grade: book.grade,
          barcode: book.barcode,
          condition: book.condition,
          imgUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBook({
          title: "",
          author: "",
          grade: "",
          barcode: "",
          condition: "",
        });
        setIsApproved(null);
        alreadyScannedRef.current = false;
        setSuccessMessage("הספר נוסף בהצלחה!");
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

  // Validate barcode against approved books and fill form
  const validateAndFillBook = async (cleanedBarcode) => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch(
        `${API_BASE}/api/books/barcode/${cleanedBarcode}`
      );
      const data = await res.json();

      if (res.ok && data) {
        setBook((prev) => ({
          ...prev,
          title: data.title || "",
          author: data.author || "",
          grade: data.grade || "",
          barcode: cleanedBarcode,
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
      qrbox: { width: 500, height: 300 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      aspectRatio: 1.7777778,
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
    setBook({ ...book, [name]: value });
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
            <div className="input-row">
              <div className="input-group">
                <span className="material-icons input-icon">book</span>
                <input
                  type="text"
                  name="title"
                  className="input-field"
                  placeholder="שם הספר"
                  value={book.title}
                  readOnly
                  style={{ backgroundColor: "#f3f4f6" }}
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
                  readOnly
                  style={{ backgroundColor: "#f3f4f6" }}
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <span className="material-icons input-icon">qr_code</span>
                <input
                  type="text"
                  name="barcode"
                  className="input-field"
                  placeholder="ברקוד"
                  value={book.barcode}
                  readOnly
                  style={{ backgroundColor: "#f3f4f6" }}
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
                  readOnly
                  style={{ backgroundColor: "#f3f4f6" }}
                />
              </div>
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

            <div className="input-group">
              <label className="button button-secondary" htmlFor="image-upload">
                העלאת תמונה של הספר
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isLoading}
                style={{ display: "none" }}
              />
            </div>
            {imageFile && (
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <small style={{ display: "block" }}>
                  תמונה נבחרה: {imageFile.name}
                </small>
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "red",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "10px auto",
                  }}
                >
                  <span className="material-icons">delete</span>
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="button button-primary"
              disabled={isLoading || !isApproved}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
              }}
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

            {successMessage && (
              <div
                className="success"
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: "2px 5px",
                  borderRadius: "2px",
                  fontSize: "13px",
                  minHeight: "unset",
                  background: "none",
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  border: "none",
                }}
              >
                <span
                  className="material-icons"
                  style={{ fontSize: 20, color: "#2e7d32", marginLeft: 6 }}
                >
                  check_circle
                </span>
                <span style={{ fontWeight: "bold", fontSize: 15 }}>
                  {successMessage}
                </span>
              </div>
            )}
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
          max-width: 780px;
          margin: 0 auto;
          width: 100%;
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
          padding: 0 var(--spacing-md);
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
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-row {
          display: flex;
          gap: 16px;
          margin-bottom: 0;
        }

        .input-row .input-group {
          flex: 1;
          margin: 0;
        }

        .input-group {
          display: flex;
          align-items: center;
          margin-bottom: 0;
        }

        .input-field {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: var(--background);
          height: 40px;
          font-size: 14px;
        }

        select.input-field {
          cursor: pointer;
          width: 100%;
          appearance: none;
          padding-right: 32px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
        }

        .input-icon {
          margin-left: 8px;
          color: var(--primary);
          font-size: 20px;
        }

        .success, .error {
          margin: 8px 0;
          padding: 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        .error {
          background-color: #ffebee;
          color: #c62828;
        }

        .button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        .button-secondary {
          padding: 8px 16px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: var(--background);
          color: var(--text-primary);
          cursor: pointer;
          width: 100%;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        /* Override scanner styles */
        #qr-reader {
          width: 60% !important;
          max-width: 320px;
          margin: 0 auto;
        }

        #qr-reader video {
          width: 100% !important;
          height: auto !important;
          max-height: 100px !important;
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
          padding: 7px 8px !important;
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

        @media (max-width: 768px) {
          .upload-page {
            padding: var(--spacing-md);
          }

          .upload-card {
            padding: var(--spacing-lg);
          }

          .input-row {
            flex-direction: column;
            gap: 9px;
          }

          .input-group {
            width: 100%;
          }
        }

        /* Book Cards Grid Layout */
        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 12px;
          padding: 12px;
        }

        .book-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .book-card__image {
          height: 120px;
          width: 100%;
          object-fit: cover;
        }

        .book-card__content {
          padding: 12px;
          flex: 1;
        }

        .book-card__title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .book-card__details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .book-card__tag {
          background-color: #f1f1f1;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 11px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .book-card__tag .material-icons {
          font-size: 14px;
        }

        .book-card__footer {
          padding: 12px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 8px;
        }

        .book-card__button {
          flex: 1;
          height: 30px;
          border: 1px solid #10b981;
          border-radius: 4px;
          background: white;
          color: #10b981;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .book-card__button:hover {
          background: #10b981;
          color: white;
        }

        .book-card__button .material-icons {
          font-size: 16px;
        }

        .book-card__button--primary {
          background: #10b981;
          color: white;
        }

        .book-card__button--primary:hover {
          background: #047857;
        }

        @media (max-width: 540px) {
          .books-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 8px;
            padding: 8px;
          }

          .book-card__image {
            height: 100px;
          }

          .book-card__content {
            padding: 8px;
          }

          .book-card__footer {
            padding: 8px;
          }
        }

        .input-field:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.8;
        }

        .button-secondary {
          background-color: white;
          border: 1px solid #e5e7eb;
          color: #374151;
          transition: all 0.2s;
        }

        .button-secondary:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }

        .button-secondary .material-icons {
          font-size: 20px;
        }
      `}</style>
    </div>
  );
}
