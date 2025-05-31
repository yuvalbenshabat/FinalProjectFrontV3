// Home Page Component
// This component serves as the landing page after login
// It displays a welcome message and information about the BookIt platform

import React from "react";
import { useUser } from "../context/UserContext";
import logo from "../assets/logo.png";
import "../styles/theme.css";

function HomePage() {
  // Get current user data from context
  const { user } = useUser();

  return (
    <div className="home-page">
      <div className="container">
        <div className="home-card card elevation-1">
          {/* Header section with logo and welcome message */}
          <div className="home-header">
            <div className="home-logo-container">
              <img src={logo} alt="BookIt Logo" className="home-logo" />
            </div>
            {/* Personalized welcome message - shows username if logged in */}
            <div className="home-welcome-container">
              <h2 className="home-welcome" dir="rtl">
                <span className="material-icons">waving_hand</span>
                שלום, {user?.username || "משתמש"}
              </h2>
            </div>
          </div>

          {/* Main title with highlighted app name */}
          <h1 className="home-title" dir="rtl">
            ברוכים הבאים ל־<span className="home-title-highlight">BookIt</span>
          </h1>

          {/* Information section about the platform */}
          <div className="home-features">
            {/* Feature cards */}
            <div className="feature-card elevation-1">
              <span className="material-icons feature-icon">volunteer_activism</span>
              <h3>תרומה וחיפוש</h3>
              <p>
                אפליקציית BookIt נועדה לעזור לקהילות ולמשפחות להשיג בקלות ובחינם ספרי לימוד לילדים — דרך שיתוף ותרומות של ספרים.
              </p>
            </div>

            <div className="feature-card elevation-1">
              <span className="material-icons feature-icon">recycling</span>
              <h3>מיחזור חכם</h3>
              <p>
                במקום להשליך ספרים ישנים – תרמו אותם דרך האפליקציה לאלו שזקוקים. אנשים יכולים לתרום, לחפש, לשמור לרשימת חסרים, ולהתקשר עם תורמים.
              </p>
            </div>

            <div className="feature-card elevation-1">
              <span className="material-icons feature-icon">location_on</span>
              <h3>התאמה מקומית</h3>
              <p>
                המערכת בנויה לתמוך בצרכים האמיתיים של הקהילה – כולל חיפוש לפי אזור, ניהול אישי, והתאמה אישית.
              </p>
            </div>
          </div>

          {/* Mission statement */}
          <div className="home-mission elevation-2">
            <span className="material-icons mission-icon">favorite</span>
            <p className="mission-text">
              יחד נוכל לחסוך, לעזור לאחרים, ולתת הזדמנות שווה.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .home-page {
          min-height: calc(100vh - 64px);
          background-color: var(--surface);
          padding: var(--spacing-xl) var(--spacing-md);
        }

        .home-card {
          background: var(--background);
          padding: var(--spacing-xl);
          margin-bottom: var(--spacing-xl);
        }

        .home-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-xl);
        }

        .home-logo-container {
          flex-shrink: 0;
        }

        .home-logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          box-shadow: var(--elevation-1);
        }

        .home-welcome-container {
          flex-grow: 1;
        }

        .home-welcome {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--text-primary);
          margin: 0;
        }

        .home-welcome .material-icons {
          color: var(--primary);
          font-size: var(--font-size-xl);
        }

        .home-title {
          text-align: center;
          margin-bottom: var(--spacing-2xl);
          color: var(--text-primary);
        }

        .home-title-highlight {
          color: var(--primary);
        }

        .home-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }

        .feature-card {
          background: var(--background);
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          text-align: center;
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--elevation-2);
        }

        .feature-icon {
          font-size: 48px;
          color: var(--primary);
          margin-bottom: var(--spacing-md);
        }

        .feature-card h3 {
          color: var(--text-primary);
          margin-bottom: var(--spacing-md);
        }

        .feature-card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .home-mission {
          background: var(--primary);
          color: white;
          padding: var(--spacing-xl);
          border-radius: var(--radius-lg);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
        }

        .mission-icon {
          font-size: 48px;
        }

        .mission-text {
          font-size: var(--font-size-lg);
          font-weight: 500;
          margin: 0;
          color: white;
        }

        @media (max-width: 768px) {
          .home-page {
            padding: var(--spacing-md);
          }

          .home-card {
            padding: var(--spacing-lg);
          }

          .home-header {
            flex-direction: column;
            text-align: center;
          }

          .home-welcome {
            justify-content: center;
          }

          .home-features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
