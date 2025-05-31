// Register Component
// This component handles new user registration with location-based features
// It includes form validation and city auto-completion using OpenStreetMap API

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;

export default function Register() {
  // State for form inputs and UI
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch city suggestions from OpenStreetMap when city input changes
  useEffect(() => {
    if (city.length < 2) return;

    // Debounce API calls to avoid too many requests
    const delayDebounce = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${city}`, {
        headers: {
          'User-Agent': 'BookIt/1.0 (support@bookit.local)',
          'Accept-Language': 'he'
        }
      })
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(err => {
          console.error("שגיאה בשליפת ערים:", err);
          setSuggestions([]);
        });
    }, 500);

    // Cleanup timeout on component unmount or city change
    return () => clearTimeout(delayDebounce);
  }, [city]);

  // Handle city selection from suggestions
  const handleSelectCity = (item) => {
    // Extract city name from OpenStreetMap response
    const name = item.address?.city || item.address?.town || item.address?.village || item.display_name;
    setCity(name);
    setCoordinates({ lat: item.lat, lng: item.lon });
    setSuggestions([]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate all required fields
    if (!email || !password || !username || !city || !phone || !coordinates.lat) {
      setError("נא למלא את כל השדות כולל עיר וקואורדינטות");
      return;
    }

    try {
      setIsLoading(true);
      // Send registration request to server
      await axios.post(`${API_BASE}/register`, {
        email,
        password,
        username,
        phone,
        city,
        location: coordinates,
      });

      // Redirect to login on success
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "שגיאה בהרשמה");
      console.error("שגיאת שרת:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter duplicate city suggestions
  const uniqueSuggestions = suggestions.reduce((acc, item) => {
    const name = item.address?.city || item.address?.town || item.address?.village || item.display_name;
    if (!acc.find(i => i.name === name)) {
      acc.push({ ...item, name });
    }
    return acc;
  }, []);

  return (
    <div className="register-page">
      <div className="register-card card elevation-2">
        {/* App logo */}
        <div className="register-header">
          <span className="material-icons" style={{ fontSize: '48px', color: 'var(--primary)' }}>
            how_to_reg
          </span>
          <h1>הרשמה ל־BookIt</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="error">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}
        
        {/* Registration form */}
        <form onSubmit={handleSubmit} dir="rtl">
          {/* User details inputs */}
          <div className="input-group">
            <span className="material-icons input-icon">person</span>
            <input 
              type="text" 
              className="input-field"
              placeholder="שם מלא" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <span className="material-icons input-icon">email</span>
            <input 
              type="email" 
              className="input-field"
              placeholder="אימייל" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <span className="material-icons input-icon">lock</span>
            <input 
              type="password" 
              className="input-field"
              placeholder="סיסמה" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <span className="material-icons input-icon">phone</span>
            <input 
              type="tel" 
              className="input-field"
              placeholder="מספר טלפון" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* City selection with auto-complete */}
          <div className="input-group">
            <span className="material-icons input-icon">location_city</span>
            <input
              type="text"
              className="input-field"
              placeholder="בחר עיר מתוך הרשימה"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setCoordinates({ lat: null, lng: null });
              }}
              disabled={isLoading}
            />
          </div>

          {/* Warning message if city not selected from suggestions */}
          {!coordinates.lat && city && (
            <div className="warning">
              <span className="material-icons">info</span>
              נא לבחור עיר מתוך ההצעות בלבד
            </div>
          )}

          {/* City suggestions dropdown */}
          {uniqueSuggestions.length > 0 && (
            <ul className="suggestions-dropdown elevation-1">
              {uniqueSuggestions.map((item, index) => (
                <li 
                  key={index} 
                  className="suggestion-item"
                  onClick={() => handleSelectCity(item)}
                >
                  <span className="material-icons">location_on</span>
                  {item.name}
                </li>
              ))}
            </ul>
          )}

          {/* Submit button */}
          <button 
            type="submit" 
            className="button button-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="button-loading">
                <span className="material-icons spinning">refresh</span>
                טוען...
              </div>
            ) : (
              <>
                <span className="material-icons">person_add</span>
                הירשם
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="login-link">
          כבר יש לך משתמש? <Link to="/">התחבר</Link>
        </p>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
          padding: var(--spacing-md);
        }

        .register-card {
          width: 100%;
          max-width: 400px;
          padding: var(--spacing-xl);
          background: var(--background);
          text-align: center;
        }

        .register-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .register-header h1 {
          margin: 0;
          color: var(--primary);
        }

        .warning {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: #f57c00;
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-sm);
          background-color: rgba(245, 124, 0, 0.04);
          border-radius: var(--radius-sm);
        }

        .suggestions-dropdown {
          list-style: none;
          padding: 0;
          margin: 0;
          margin-bottom: var(--spacing-md);
          background: var(--background);
          border-radius: var(--radius-md);
          max-height: 200px;
          overflow-y: auto;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .suggestion-item:hover {
          background-color: var(--surface);
        }

        .suggestion-item .material-icons {
          color: var(--text-secondary);
          font-size: var(--font-size-md);
        }

        .login-link {
          margin-top: var(--spacing-xl);
          color: var(--text-secondary);
        }

        .login-link a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .login-link a:hover {
          color: var(--primary-dark);
        }

        @media (max-width: 480px) {
          .register-card {
            padding: var(--spacing-lg);
          }
        }
      `}</style>
    </div>
  );
}
