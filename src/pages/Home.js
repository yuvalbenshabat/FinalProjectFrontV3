import React from "react";
import { useUser } from "../context/UserContext";
import logo from "../assets/logo.png";
import "../styles/components.css";

function HomePage() {
  const { user } = useUser();

  return (
    <div className="page-container">
      <div className="home-content">
        <div className="home-card">
          <div className="home-header">
            <img src={logo} alt="BookIt Logo" className="home-logo" />
            <h2 className="home-welcome" dir="rtl">
              שלום, {user?.username || "משתמש"} 👋
            </h2>
          </div>

          <h1 className="home-title" dir="rtl">
            ברוכים הבאים ל־<span className="home-title-highlight">BookIt</span>
          </h1>

          <div className="home-text-container">
            <p className="home-text">
              אפליקציית BookIt נועדה לעזור לקהילות ולמשפחות להשיג בקלות ובחינם ספרי לימוד לילדים — דרך שיתוף ותרומות של ספרים.
            </p>
            <p className="home-text">
              במקום להשליך ספרים ישנים – תרמו אותם דרך האפליקציה לאלו שזקוקים. אנשים יכולים לתרום, לחפש, לשמור לרשימת חסרים, ולהתקשר עם תורמים – הכל במקום אחד, נגיש ונוח.
            </p>
            <p className="home-text">
              המערכת בנויה לתמוך בצרכים האמיתיים של הקהילה – כולל חיפוש לפי אזור, ניהול אישי, והתאמה אישית.
            </p>
            <p className="home-text home-text-bold">
              יחד נוכל לחסוך, לעזור לאחרים, ולתת הזדמנות שווה.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
