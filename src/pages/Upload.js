// Upload Component
// This component handles the donation of books through barcode scanning and manual input
// It validates books against an approved list and saves them to the database

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScanType } from "html5-qrcode";
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
  const [cameraError, setCameraError] = useState(false);

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
  const startScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }

    // Set scanning state first
    setIsScanning(true);
    setError(""); // Clear any previous errors
    setCameraError(false); // Clear camera error flag

    // Wait for the DOM to update and then initialize scanner
    setTimeout(async () => {
      try {
        // Clear the qr-reader div content
        const qrReader = document.getElementById("qr-reader");
        if (qrReader) {
          qrReader.innerHTML = "";
        }

        // Check if camera is available
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          throw new Error("לא נמצאה מצלמה במכשיר");
        }

        const scanner = new Html5Qrcode("qr-reader");

        const config = {
          fps: 10,
          qrbox: { width: 300, height: 200 },
          aspectRatio: 1.0
        };

        // Try back camera first, fallback to any available camera
        let cameraConfig = { facingMode: "environment" };
        
        try {
          await scanner.start(
            cameraConfig,
            config,
            async (decodedText) => {
              if (scannerRef.current) {
                try {
                  await scannerRef.current.stop();
                  setIsScanning(false);
                } catch (err) {
                  console.warn("Error stopping scanner:", err);
                }
                scannerRef.current = null;
              }

              await handleBarcodeScanned(decodedText);
            },
            (errorMessage) => {
              if (
                !errorMessage.includes("No MultiFormat Readers") &&
                !errorMessage.includes("parse error")
              ) {
                console.warn("Scanner error:", errorMessage);
              }
            }
          );
        } catch (backCameraError) {
          // If back camera fails, try front camera
          console.warn("Back camera failed, trying front camera:", backCameraError);
          cameraConfig = { facingMode: "user" };
          
          await scanner.start(
            cameraConfig,
            config,
            async (decodedText) => {
              if (scannerRef.current) {
                try {
                  await scannerRef.current.stop();
                  setIsScanning(false);
                } catch (err) {
                  console.warn("Error stopping scanner:", err);
                }
                scannerRef.current = null;
              }

              await handleBarcodeScanned(decodedText);
            },
            (errorMessage) => {
              if (
                !errorMessage.includes("No MultiFormat Readers") &&
                !errorMessage.includes("parse error")
              ) {
                console.warn("Scanner error:", errorMessage);
              }
            }
          );
        }

        scannerRef.current = scanner;
        
      } catch (err) {
        console.error("Error starting scanner:", err);
        let errorMsg = "שגיאה בפתיחת המצלמה.";
        
        // Safely get error message
        const errorMessage = err.message || err.toString() || '';
        
        if (errorMessage.includes("Device in use") || errorMessage.includes("NotReadableError")) {
          errorMsg = "המצלמה בשימוש על ידי אפליקציה אחרת. אנא סגור אפליקציות אחרות ונסה שוב.";
        } else if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
          errorMsg = "נדחתה הגישה למצלמה. אנא אפשר גישה למצלמה בהגדרות הדפדפן.";
        } else if (errorMessage.includes("לא נמצאה מצלמה")) {
          errorMsg = errorMessage;
        } else if (errorMessage.includes("NotFoundError")) {
          errorMsg = "לא נמצאה מצלמה במכשיר זה.";
        } else {
          errorMsg = "שגיאה בפתיחת המצלמה. אנא בדוק שנתת הרשאה לגישה למצלמה.";
        }
        
        setError(errorMsg);
        setIsScanning(false);
        setCameraError(true);
      }
    }, 100); // Small delay to ensure DOM is updated
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        console.log("Scanner stopped successfully");
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    
    // Also clear the qr-reader div content
    const qrReader = document.getElementById("qr-reader");
    if (qrReader) {
      qrReader.innerHTML = "";
    }
    
    setIsScanning(false);
    setError(""); // Clear any errors when stopping
    setCameraError(false); // Clear camera error flag
  };

  // Initialize scanner on component mount and cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(console.warn);
        } catch (err) {
          console.warn("Error cleaning up scanner:", err);
        }
        scannerRef.current = null;
      }
      setIsScanning(false);
      // Clear the qr-reader div content on unmount
      const qrReader = document.getElementById("qr-reader");
      if (qrReader) {
        qrReader.innerHTML = "";
      }
    };
  }, []);

  const handleScanButtonClick = async () => {
    if (isScanning) {
      await stopScanner();
    } else {
      await startScanner();
    }
  };

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
            {!isScanning ? (
              <div className="scanner-placeholder">
                <img 
                  width="64" 
                  src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNzEuNjQzIDM3MS42NDMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDM3MS42NDMgMzcxLjY0MyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTEwNS4wODQgMzguMjcxaDE2My43Njh2MjBIMTA1LjA4NHoiLz48cGF0aCBkPSJNMzExLjU5NiAxOTAuMTg5Yy03LjQ0MS05LjM0Ny0xOC40MDMtMTYuMjA2LTMyLjc0My0yMC41MjJWMzBjMC0xNi41NDItMTMuNDU4LTMwLTMwLTMwSDEyNS4wODRjLTE2LjU0MiAwLTMwIDEzLjQ1OC0zMCAzMHYxMjAuMTQzaC04LjI5NmMtMTYuNTQyIDAtMzAgMTMuNDU4LTMwIDMwdjEuMzMzYTI5LjgwNCAyOS44MDQgMCAwIDAgNC42MDMgMTUuOTM5Yy03LjM0IDUuNDc0LTEyLjEwMyAxNC4yMjEtMTIuMTAzIDI0LjA2MXYxLjMzM2MwIDkuODQgNC43NjMgMTguNTg3IDEyLjEwMyAyNC4wNjJhMjkuODEgMjkuODEgMCAwIDAtNC42MDMgMTUuOTM4djEuMzMzYzAgMTYuNTQyIDEzLjQ1OCAzMCAzMCAzMGg4LjMyNGMuNDI3IDExLjYzMSA3LjUwMyAyMS41ODcgMTcuNTM0IDI2LjE3Ny45MzEgMTAuNTAzIDQuMDg0IDMwLjE4NyAxNC43NjggNDUuNTM3YTkuOTg4IDkuOTg4IDAgMCAwIDguMjE2IDQuMjg4IDkuOTU4IDkuOTU4IDAgMCAwIDUuNzA0LTEuNzkzYzQuNTMzLTMuMTU1IDUuNjUtOS4zODggMi40OTUtMTMuOTIxLTYuNzk4LTkuNzY3LTkuNjAyLTIyLjYwOC0xMC43Ni0zMS40aDgyLjY4NWMuMjcyLjQxNC41NDUuODE4LjgxNSAxLjIxIDMuMTQyIDQuNTQxIDkuMzcyIDUuNjc5IDEzLjkxMyAyLjUzNCA0LjU0Mi0zLjE0MiA1LjY3Ny05LjM3MSAyLjUzNS0xMy45MTMtMTEuOTE5LTE3LjIyOS04Ljc4Ny0zNS44ODQgOS41ODEtNTcuMDEyIDMuMDY3LTIuNjUyIDEyLjMwNy0xMS43MzIgMTEuMjE3LTI0LjAzMy0uODI4LTkuMzQzLTcuMTA5LTE3LjE5NC0xOC42NjktMjMuMzM3YTkuODU3IDkuODU3IDAgMCAwLTEuMDYxLS40ODZjLS40NjYtLjE4Mi0xMS40MDMtNC41NzktOS43NDEtMTUuNzA2IDEuMDA3LTYuNzM3IDE0Ljc2OC04LjI3MyAyMy43NjYtNy42NjYgMjMuMTU2IDEuNTY5IDM5LjY5OCA3LjgwMyA0Ny44MzYgMTguMDI2IDUuNzUyIDcuMjI1IDcuNjA3IDE2LjYyMyA1LjY3MyAyOC43MzMtLjQxMyAyLjU4NS0uODI0IDUuMjQxLTEuMjQ1IDcuOTU5LTUuNzU2IDM3LjE5NC0xMi45MTkgODMuNDgzLTQ5Ljg3IDExNC42NjEtNC4yMjEgMy41NjEtNC43NTYgOS44Ny0xLjE5NCAxNC4wOTJhOS45OCA5Ljk4IDAgMCAwIDcuNjQ4IDMuNTUxIDkuOTU1IDkuOTU1IDAgMCAwIDYuNDQ0LTIuMzU4YzQyLjY3Mi0zNi4wMDUgNTAuODAyLTg4LjUzMyA1Ni43MzctMTI2Ljg4OC40MTUtMi42ODQuODIxLTUuMzA5IDEuMjI5LTcuODYzIDIuODM0LTE3LjcyMS0uNDU1LTMyLjY0MS05Ljc3Mi00NC4zNDV6bS0yMzIuMzA4IDQyLjYyYy01LjUxNCAwLTEwLTQuNDg2LTEwLTEwdi0xLjMzM2MwLTUuNTE0IDQuNDg2LTEwIDEwLTEwaDE1djIxLjMzM2gtMTV6bS0yLjUtNTIuNjY2YzAtNS41MTQgNC40ODYtMTAgMTAtMTBoNy41djIxLjMzM2gtNy41Yy01LjUxNCAwLTEwLTQuNDg2LTEwLTEwdi0xLjMzM3ptMTcuNSA5My45OTloLTcuNWMtNS41MTQgMC0xMC00LjQ4Ni0xMC0xMHYtMS4zMzNjMC01LjUxNCA0LjQ4Ni0xMCAxMC0xMGg3LjV2MjEuMzMzem0zMC43OTYgMjguODg3Yy01LjUxNCAwLTEwLTQuNDg2LTEwLTEwdi04LjI3MWg5MS40NTdjLS44NTEgNi42NjgtLjQzNyAxMi43ODcuNzMxIDE4LjI3MWgtODIuMTg4em03OS40ODItMTEzLjY5OGMtMy4xMjQgMjAuOTA2IDEyLjQyNyAzMy4xODQgMjEuNjI1IDM3LjA0IDUuNDQxIDIuOTY4IDcuNTUxIDUuNjQ3IDcuNzAxIDcuMTg4LjIxIDIuMTUtMi41NTMgNS42ODQtNC40NzcgNy4yNTEtLjQ4Mi4zNzgtLjkyOS44LTEuMzM1IDEuMjYxLTYuOTg3IDcuOTM2LTExLjk4MiAxNS41Mi0xNS40MzIgMjIuNjg4aC05Ny41NjRWMzBjMC01LjUxNCA0LjQ4Ni0xMCAxMC0xMGgxMjMuNzY5YzUuNTE0IDAgMTAgNC40ODYgMTAgMTB2MTM1LjU3OWMtMy4wMzItLjM4MS02LjE1LS42OTQtOS4zODktLjkxNC0yNS4xNTktMS42OTQtNDIuMzcgNy43NDgtNDQuODk4IDI0LjY2NnoiLz48cGF0aCBkPSJNMTc5LjEyOSA4My4xNjdoLTI0LjA2YTUgNSAwIDAgMC01IDV2MjQuMDYxYTUgNSAwIDAgMCA1IDVoMjQuMDZhNSA1IDAgMCAwIDUtNVY4OC4xNjdhNSA1IDAgMCAwLTUtNXpNMTcyLjYyOSAxNDIuODZoLTEyLjU2VjEzMC44YTUgNSAwIDEgMC0xMCAwdjE3LjA2MWE1IDUgMCAwIDAgNSA1aDE3LjU2YTUgNSAwIDEgMCAwLTEwLjAwMXpNMjE2LjU2OCA4My4xNjdoLTI0LjA2YTUgNSAwIDAgMC01IDV2MjQuMDYxYTUgNSAwIDAgMCA1IDVoMjQuMDZhNSA1IDAgMCAwIDUtNVY4OC4xNjdhNSA1IDAgMCAwLTUtNXptLTUgMjQuMDYxaC0xNC4wNlY5My4xNjdoMTQuMDZ2MTQuMDYxek0yMTEuNjY5IDEyNS45MzZIMTk3LjQxYTUgNSAwIDAgMC01IDV2MTQuMjU3YTUgNSAwIDAgMCA1IDVoMTQuMjU5YTUgNSAwIDAgMCA1LTV2LTE0LjI1N2E1IDUgMCAwIDAtNS01eiIvPjwvc3ZnPg==" 
                  alt="קליק כדי להתחיל סריקה" 
                  style={{ opacity: 0.8 }}
                />
                <p style={{ marginTop: '20px', color: '#666', textAlign: 'center' }}>
                  לחץ על "התחל סריקה" כדי לפתוח את המצלמה
                </p>
              </div>
            ) : (
              <div id="qr-reader" className="scanner"></div>
            )}
            <button 
              onClick={handleScanButtonClick}
              className="scan-button"
            >
              {isScanning ? (
                <>
                  <span className="material-icons">stop</span>
                  הפסק סריקה
                </>
              ) : cameraError ? (
                <>
                  <span className="material-icons">refresh</span>
                  נסה שוב
                </>
              ) : (
                <>
                  <span className="material-icons">qr_code_scanner</span>
                  התחל סריקה
                </>
              )}
            </button>
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
          font-size: 24px;
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

        .scanner-placeholder {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 300px;
          background-color: #f8f9fa;
          border: 2px dashed #dee2e6;
          border-radius: var(--radius-md);
          margin: 10px 0;
          transition: all 0.3s ease;
        }

        .scanner-placeholder img {
          transition: transform 0.3s ease;
        }

        .scanner-placeholder img:hover {
          transform: scale(1.1);
        }

        .scanner-placeholder:hover {
          background-color: #e9ecef;
          border-color: var(--primary);
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
          width: 100% !important;
          max-width: 500px !important;
          margin: 0 auto;
          border: none !important;
          box-shadow: none !important;
        }

        #qr-reader video {
          width: 100% !important;
          height: auto !important;
          max-height: 350px !important;
          margin: 0 auto;
          border-radius: 8px;
        }

        #qr-reader__scan_region {
          background: var(--background) !important;
          padding: 0 !important;
        }

        #qr-reader__scan_region img {
          width: 100% !important;
          height: auto !important;
          max-height: 350px !important;
          object-fit: contain !important;
        }

        #qr-reader__dashboard {
          padding: var(--spacing-md) !important;
          background: var(--background) !important;
          border-top: 1px solid #e0e0e0 !important;
          margin-top: var(--spacing-md) !important;
        }

        #qr-reader__dashboard button {
          padding: 8px 16px !important;
          border-radius: 8px !important;
          background: var(--primary) !important;
          color: white !important;
          border: none !important;
          cursor: pointer !important;
          font-family: var(--font-family) !important;
          font-size: 14px !important;
          transition: background-color var(--transition-fast) !important;
          width: 100% !important;
          max-width: 200px !important;
          margin: 0 auto !important;
          display: block !important;
        }

        #qr-reader__dashboard button:hover {
          background: var(--primary-dark) !important;
        }

        #qr-reader__dashboard select {
          width: 100% !important;
          max-width: 200px !important;
          margin: 0 auto var(--spacing-md) !important;
          display: block !important;
          padding: 8px !important;
          border-radius: 8px !important;
          border: 1px solid var(--border-color) !important;
          font-family: var(--font-family) !important;
          font-size: 14px !important;
          background-color: white !important;
        }

        @media (max-width: 768px) {
          .upload-page {
            padding: calc(var(--spacing-xl) + 48px) var(--spacing-sm) var(--spacing-sm) var(--spacing-sm);
            margin-top: 0;
          }

          .upload-card {
            padding: var(--spacing-md);
            margin: 0;
            border-radius: 0;
            min-height: calc(100vh - var(--spacing-xl) - 48px);
          }

          .upload-header {
            margin-bottom: var(--spacing-lg);
          }

          .upload-header h1 {
            font-size: 20px;
          }

          .upload-header .material-icons {
            font-size: 24px;
          }

          .scanner-container {
            margin: -var(--spacing-md);
            margin-bottom: var(--spacing-lg);
            border-radius: 0;
          }

          #qr-reader {
            max-width: 100% !important;
          }

          #qr-reader video {
            max-height: 300px !important;
            border-radius: 0;
          }

          .input-row {
            flex-direction: column;
            gap: 12px;
          }

          .input-group {
            width: 100%;
          }

          .input-field {
            font-size: 16px; /* Prevents zoom on mobile */
            height: 44px; /* Bigger touch target */
          }

          .button-secondary,
          .button-primary {
            height: 44px; /* Bigger touch target */
            font-size: 16px;
          }

          .scan-button {
            max-width: 100%;
            height: 48px;
          }
        }

        @media (max-width: 480px) {
          .upload-page {
            padding-top: calc(var(--spacing-xl) + 56px);
          }

          .upload-header h1 {
            font-size: 18px;
          }

          .scanner-header h3 {
            font-size: 16px;
          }

          #qr-reader video {
            max-height: 250px !important;
          }

          .input-field,
          .button-secondary,
          .button-primary {
            font-size: 15px;
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

        .scan-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          max-width: 200px;
          margin: 16px auto;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background-color: ${isScanning ? '#dc2626' : '#10b981'};
          color: white;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          direction: rtl;
        }

        .scan-button:hover {
          background-color: ${isScanning ? '#b91c1c' : '#059669'};
        }

        .scan-button .material-icons {
          font-size: 20px;
        }

        @media (max-width: 768px) {
          .scan-button {
            max-width: 100%;
            height: 48px;
          }
        }

        /* Hide default scanner buttons */
        #qr-reader__dashboard_section_csr button,
        #qr-reader__status_span,
        #qr-reader__dashboard_section_swaplink,
        #qr-reader__dashboard_section_fsr {
          display: none !important;
        }

        #qr-reader__dashboard_section {
          text-align: center !important;
        }

        #qr-reader__camera_selection {
          margin: 8px auto !important;
          max-width: 200px !important;
          direction: ltr !important;
        }

        #qr-reader {
          border: none !important;
          padding: 0 !important;
        }

        #qr-reader__dashboard {
          margin-top: 0 !important;
          padding-top: 0 !important;
          border-top: none !important;
        }
      `}</style>
    </div>
  );
}
