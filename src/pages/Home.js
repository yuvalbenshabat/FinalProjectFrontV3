// Home Page Component
// This component serves as the landing page after login
// It displays a welcome message and information about the BookIt platform

import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/theme.css";
import "../styles/home.css";

function HomePage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [cardAnimation, setCardAnimation] = useState(false);

  // Trigger animation on page load
  React.useEffect(() => {
    setCardAnimation(true);
  }, []);

  // Navigation handlers
  const handleSearchClick = () => {
    navigate("/search");
  };

  const handleUploadClick = () => {
    navigate("/upload");
  };

  return (
    <div className="home-page">
      {/* Background elements */}
      <div className="home-background">
        <div className="bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <div className="container">
        <div
          className={`home-card card elevation-1 ${
            cardAnimation ? "animate-in" : ""
          }`}
        >
          {/* Header section with logo and welcome message */}
          <div className="home-header">
            <div className="home-logo-container">
              <div className="home-logo-wrapper">
                <img src={logo} alt="BookIt Logo" className="home-logo" />
                <div className="logo-ring"></div>
              </div>
            </div>

            <div className="home-welcome-container">
              <h2 className="home-welcome" dir="rtl">
                שלום, {user?.username || "משתמש"}!
              </h2>
              <p className="welcome-subtitle">ברוך הבא לקהילת BookIt</p>
            </div>
          </div>

          {/* Hero section */}
          <div className="home-hero">
            <h1 className="home-title" dir="rtl">
              הפלטפורמה המובילה לשיתוף ספרי לימוד
            </h1>
            <p className="home-subtitle" dir="rtl">
              <span className="highlight">BookIt</span> - המקום בו משפחות וילדים
              מוצאים את הספרים שהם זקוקים להם
            </p>
          </div>

          {/* Statistics section */}
          <div className="home-stats">
            <div className="stat-card">
              <div className="stat-number">1,200+</div>
              <div className="stat-label">ספרים נתרמו</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">משפחות נעזרו</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">95%</div>
              <div className="stat-label">שביעות רצון</div>
            </div>
          </div>

          {/* Features section */}
          <div className="home-features">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-bg">
                  <span className="material-icons feature-icon">
                    volunteer_activism
                  </span>
                </div>
              </div>
              <h3>תרומה וחיפוש</h3>
              <p>
                מנוע חיפוש חכם שמאפשר למצוא ספרים בקלות לפי מקצוע, כיתה, מצב
                הספר ומיקום
              </p>
              <div className="feature-decoration"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-bg">
                  <span className="material-icons feature-icon">recycling</span>
                </div>
              </div>
              <h3>מיחזור חכם</h3>
              <p>פלטפורמה ידידותית לסביבה שמעודדת מיחזור ספרים ומפחיתה בזבוז</p>
              <div className="feature-decoration"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-bg">
                  <span className="material-icons feature-icon">
                    location_on
                  </span>
                </div>
              </div>
              <h3>קהילה מקומית</h3>
              <p>התחברות בין תושבי האזור לשיתוף משאבים ויצירת קהילה חזקה</p>
              <div className="feature-decoration"></div>
            </div>
          </div>

          {/* Call to action */}
          <div className="home-cta">
            <div className="cta-content">
              <h2>מוכנים להתחיל?</h2>
              <p>בואו נעשה את הדרך לחינוך איכותי נגישה לכולם</p>
              <div className="cta-buttons">
                <button
                  className="btn-primary cta-btn"
                  onClick={handleSearchClick}
                >
                  <span className="material-icons">search</span>
                  חפש ספרים
                </button>
                <button
                  className="btn-secondary cta-btn"
                  onClick={handleUploadClick}
                >
                  <span className="material-icons">volunteer_activism</span>
                  תרום ספר
                </button>
              </div>
            </div>
            <div className="cta-visual">
              <div className="floating-books">
                <div className="book book-1">📚</div>
                <div className="book book-2">📖</div>
                <div className="book book-3">📘</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
