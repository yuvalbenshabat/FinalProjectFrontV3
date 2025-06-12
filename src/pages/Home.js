/**
 * Home Page Component
 * 
 * This is the main landing page of the BookIt application.
 * It serves as a welcoming interface for users after login, displaying:
 * - Personalized welcome message
 * - Platform statistics
 * - Key features
 * - Call-to-action buttons for main functionalities
 */

import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/theme.css";
import "../styles/home.css";

function HomePage() {
  // Get user context and navigation utility
  const { user } = useUser();
  const navigate = useNavigate();
  
  // State for card entrance animation
  const [cardAnimation, setCardAnimation] = useState(false);

  // Trigger entrance animation on component mount
  React.useEffect(() => {
    setCardAnimation(true);
  }, []);

  // Navigation handler functions
  const handleSearchClick = () => {
    navigate("/search"); // Navigate to book search page
  };

  const handleUploadClick = () => {
    navigate("/upload"); // Navigate to book donation page
  };

  return (
    <div className="home-page">
      {/* Decorative background shapes for visual interest */}
      <div className="home-background">
        <div className="bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <div className="container">
        {/* Main content card with entrance animation */}
        <div
          className={`home-card card elevation-1 ${
            cardAnimation ? "animate-in" : ""
          }`}
        >
          {/* Header Section: Logo and Welcome Message */}
          <div className="home-header">
            <div className="home-logo-container">
              <div className="home-logo-wrapper">
                <img src={logo} alt="BookIt Logo" className="home-logo" />
                <div className="logo-ring"></div>
              </div>
            </div>

            {/* Personalized welcome message */}
            <div className="home-welcome-container">
              <h2 className="home-welcome" dir="rtl">
                שלום, {user?.username || "משתמש"}!
              </h2>
              <p className="welcome-subtitle">ברוך הבא לקהילת BookIt</p>
            </div>
          </div>

          {/* Hero Section: Main value proposition */}
          <div className="home-hero">
            <h1 className="home-title" dir="rtl">
              הפלטפורמה המובילה לשיתוף ספרי לימוד
            </h1>
            <p className="home-subtitle" dir="rtl">
              <span className="highlight">BookIt</span> - המקום בו משפחות וילדים
              מוצאים את הספרים שהם זקוקים להם
            </p>
          </div>

          {/* Statistics Section: Platform impact metrics */}
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

          {/* Features Section: Key platform capabilities */}
          <div className="home-features">
            {/* Search and Donate Feature */}
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

            {/* Smart Recycling Feature */}
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

            {/* Local Community Feature */}
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

          {/* Call to Action Section: Primary user actions */}
          <div className="home-cta">
            <div className="cta-content">
              <h2>מוכנים להתחיל?</h2>
              <p>בואו נעשה את הדרך לחינוך איכותי נגישה לכולם</p>
              <div className="cta-buttons">
                {/* Search Books CTA Button */}
                <button
                  className="btn-primary cta-btn"
                  onClick={handleSearchClick}
                >
                  <span className="material-icons">search</span>
                  חפש ספרים
                </button>
                {/* Donate Books CTA Button */}
                <button
                  className="btn-secondary cta-btn"
                  onClick={handleUploadClick}
                >
                  <span className="material-icons">volunteer_activism</span>
                  תרום ספר
                </button>
              </div>
            </div>
            {/* Decorative floating books animation */}
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
