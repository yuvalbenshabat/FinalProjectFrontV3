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
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Fetch city suggestions from OpenStreetMap when city input changes
  useEffect(() => {
    if (city.length < 2) return;

    // Debounce API calls to avoid too many requests
    const delayDebounce = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${city}&viewbox=34.267,33.335,35.895,29.489&bounded=1&countrycodes=il`, {
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
    setSuccess("");
    
    // Validate all required fields
    if (!username.trim()) {
      setError("שם המשתמש לא יכול להיות ריק או להכיל רק רווחים");
      return;
    }
    if (/\d/.test(username)) {
      setError("השם המלא לא יכול להכיל מספרים");
      return;
    }
    if (!email.includes("@") || email.length < 5) {
      setError("האימייל חייב להכיל @ ולהיות לפחות 5 תווים");
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להיות לפחות 6 תווים");
      return;
    }
    if (!/^05\d{8}$/.test(phone)) {
      setError("מספר הטלפון חייב להתחיל ב-05 ולהיות באורך 10 ספרות");
      return;
    }
    if (!coordinates.lat || !coordinates.lng) {
      setError("יש לבחור עיר מתוך ההצעות בלבד");
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

      // Show success message
      setSuccess("ההרשמה הושלמה בהצלחה!");
      setTimeout(() => navigate("/"), 1000);
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
          <img src={require('../assets/logo.png')} alt="BookIt Logo" style={{ width: '64px', height: '64px' }} />
          <h1>הרשמה ל־BookIt</h1>
        </div>

        {/* Success message */}
        {success && (
          <div className="success" style={{ color: 'green', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="material-icons" style={{ marginRight: '0.5rem' }}>check_circle</span>
            {success}
          </div>
        )}

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
              onChange={(e) => {
                const value = e.target.value;
                // Allow only letters, spaces, and Hebrew characters
                if (!/\d/.test(value)) {
                  setUsername(value);
                }
              }}
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
              dir="rtl"
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
            <ul className="suggestions-dropdown elevation-1" style={{ listStyleType: 'none', padding: 0, margin: 0, textAlign: 'right' }}>
              {uniqueSuggestions.map((item, index) => (
                <li 
                  key={index} 
                  onClick={() => handleSelectCity(item)}
                  style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s ease-in-out' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span className="material-icons" style={{ marginLeft: '0.5rem', color: '#9fb3c8' }}>location_on</span>
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
                <span className="material-icons">how_to_reg</span>
                הירשם
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="login-link">
          כבר יש לך משתמש? <Link to="/login">התחבר</Link>
        </p>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
          padding: 1rem;
        }

        .register-card {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
          background: #ffffff;
          text-align: center;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .register-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .register-header h1 {
          margin: 0;
          color: #334e68;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .input-group {
          position: relative;
          margin-bottom: 1rem;
        }

        .input-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9fb3c8;
        }

        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          padding-right: 3rem;
          border: 1px solid #d9e2ec;
          border-radius: 0.375rem;
          transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .input-field:focus {
          border-color: #627d98;
          box-shadow: 0 0 0 3px rgba(98, 125, 152, 0.2);
          outline: none;
        }

        .button {
          width: 100%;
          margin-top: 1.5rem;
          padding: 0.75rem 1rem;
          background-color: #10b981;
          color: #ffffff;
          border-radius: 0.375rem;
          transition: background-color 0.2s ease-in-out;
        }

        .button:hover {
          background-color: #047857;
        }

        .button:disabled {
          background-color: #9fb3c8;
        }

        .button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .login-link {
          margin-top: 2rem;
          color: #627d98;
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

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
