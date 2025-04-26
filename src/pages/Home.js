import React from "react";
import { useUser } from "../context/UserContext";
import logo from "../assets/logo.png";

function HomePage() {
  const { user } = useUser();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logo} alt="BookIt Logo" style={styles.logo} />

        {/* ברכה עם שם המשתמש */}
        <h2 style={{ direction: "rtl", color: "#555" }}>
          שלום, {user?.username || "משתמש"} 👋
        </h2>

        <h1 style={styles.title}>
          ברוכים הבאים ל־<span style={{ color: "#f6c90e" }}>BookIt</span>
        </h1>

        <p style={styles.text}>
          אפליקציית BookIt נועדה לעזור לקהילות ולמשפחות להשיג בקלות ובחינם ספרי לימוד לילדים — דרך שיתוף ותרומות של ספרים.
        </p>
        <p style={styles.text}>
          במקום להשליך ספרים ישנים – תרמו אותם דרך האפליקציה לאלו שזקוקים. אנשים יכולים לתרום, לחפש, לשמור לרשימת חסרים, ולהתקשר עם תורמים – הכל במקום אחד, נגיש ונוח.
        </p>
        <p style={styles.text}>
          המערכת בנויה לתמוך בצרכים האמיתיים של הקהילה – כולל חיפוש לפי אזור, ניהול אישי, והתאמה אישית.
        </p>
        <p style={{ ...styles.text, fontWeight: "bold" }}>
          יחד נוכל לחסוך, לעזור לאחרים, ולתת הזדמנות שווה.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#e0e7ff",
    minHeight: "100vh",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },
  navbar: {
    backgroundColor: "#f3f4f6",
    display: "flex",
    justifyContent: "space-around",
    width: "100%",
    padding: "10px",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  navItem: {
    fontWeight: "bold",
    color: "#333",
    fontSize: "1rem",
  },
  card: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 0 15px rgba(0,0,0,0.1)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    marginTop: "20px",
  },
  logo: {
    width: "80px",
    height: "80px",
    marginBottom: "15px",
    borderRadius: "50%",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  title: {
    fontSize: "1.8rem",
    marginBottom: "20px",
    color: "#333",
  },
  text: {
    fontSize: "1rem",
    lineHeight: "1.6",
    color: "#444",
    marginBottom: "15px",
    textAlign: "right",
    direction: "rtl",
  },
};

export default HomePage;
