import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Html5Qrcode } from "html5-qrcode";

export default function Upload() {
  const [book, setBook] = useState({
    title: "",
    author: "",
    grade: "",
    barcode: "",
    condition: ""
  });

  const [approvedBooks, setApprovedBooks] = useState([]);
  const [isApproved, setIsApproved] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scannerRef.current) return; // 🛑 prevent double initialization

    const scanner = new Html5Qrcode("qr-reader");
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;
        scanner.start(
          cameraId,
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            handleBarcodeScanned(decodedText);
            scanner.stop();
          },
          () => {}
        );
        scannerRef.current = scanner;
      }
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current = null;
      }
    };
  }, [approvedBooks]);

  const cleanScannedBarcode = (barcode) => {
    return barcode.replace(/\s|-/g, "").replace(/0/g, "").slice(0, -1);
  };

  const handleBarcodeScanned = (rawBarcode) => {
    const cleaned = cleanScannedBarcode(rawBarcode);
    setBook((prev) => ({ ...prev, barcode: cleaned }));
    validateAndFillBook(rawBarcode);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { range: 1 });
      setApprovedBooks(data);
    };
    reader.readAsBinaryString(file);
  };

  const validateAndFillBook = (scannedBarcode) => {
    const cleanedScanned = cleanScannedBarcode(scannedBarcode);
    const match = approvedBooks.find(row => {
      const raw = row["barcode"] ?? "";
      const cleanedRow = String(raw).replace(/\s|-/g, "").replace(/0/g, "");
      return cleanedScanned === cleanedRow;
    });
    if (match) {
      setBook((prev) => ({
        ...prev,
        title: match["שם ספר"] || "",
        author: match["שמות המחברים"] || "",
        grade: match["שכבת גיל"] || "",
        barcode: scannedBarcode
      }));
      setIsApproved(true);
    } else {
      setIsApproved(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue = name === "barcode" ? cleanScannedBarcode(value) : value;
    setBook({ ...book, [name]: cleanedValue });
    if (name === "barcode") {
      validateAndFillBook(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!book.condition) {
      alert("נא לבחור את מצב הספר");
      return;
    }
    if (isApproved) {
      console.log("📤 נשלח:", book);
      alert("✅ הספר הועלה בהצלחה!");
    } else {
      alert("⚠️ הספר לא מאושר על ידי משרד החינוך");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>העלאת ספר לתרומה</h2>
        <p>📁 טען קובץ Excel של משרד החינוך:</p>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

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
