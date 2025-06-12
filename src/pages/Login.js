// src/pages/Login.js
// Login Component
// This component handles user authentication
// It provides a form for users to log in with their email and password

/**
 * Login Component
 * 
 * This component handles user authentication and login functionality.
 * It provides a form for users to enter their email and password,
 * validates the input, and handles the login process.
 * 
 * Features:
 * - Email and password validation
 * - Loading state handling
 * - Error message display
 * - Responsive design
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;
console.log("🔍 API_BASE:", API_BASE);

// Validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 50;

function Login() {
  // State management for form inputs and UI states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Hooks for navigation and user context
  const { login } = useUser();
  const navigate = useNavigate();

  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {string|null} Error message or null if valid
   */
  const validateEmail = (email) => {
    if (!email) {
      return "נא להזין כתובת אימייל";
    }
    if (!EMAIL_REGEX.test(email)) {
      return "כתובת האימייל אינה תקינה";
    }
    if (email.length > 255) {
      return "כתובת האימייל ארוכה מדי";
    }
    return null;
  };

  /**
   * Validates password format and security requirements
   * @param {string} password - Password to validate
   * @returns {string|null} Error message or null if valid
   */
  const validatePassword = (password) => {
    if (!password) {
      return "נא להזין סיסמה";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `הסיסמה חייבת להכיל לפחות ${MIN_PASSWORD_LENGTH} תווים`;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      return `הסיסמה לא יכולה להכיל יותר מ-${MAX_PASSWORD_LENGTH} תווים`;
    }
    return null;
  };

  /**
   * Validates all form fields
   * @returns {boolean} True if all fields are valid
   */
  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) {
      setError(emailError);
      return false;
    }

    if (passwordError) {
      setError(passwordError);
      return false;
    }

    return true;
  };

  /**
   * Handles form submission and login process
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate all form fields before submission
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      // API call to authenticate user
      const response = await axios.post(`${API_BASE}/login`, {
        email: email.trim(),  // Remove whitespace
        password
      });

      // On successful login, update context and redirect
      login(response.data.user);
      navigate("/home");
    } catch (err) {
      console.error("❌ שגיאה בהתחברות:", err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError("שם משתמש או סיסמה שגויים");
      } else if (err.response?.status === 429) {
        setError("יותר מדי ניסיונות התחברות. נא לנסות שוב מאוחר יותר");
      } else if (!navigator.onLine) {
        setError("אין חיבור לאינטרנט. נא לבדוק את החיבור ולנסות שוב");
      } else {
        setError(err.response?.data?.message || "שגיאה בהתחברות. נא לנסות שוב");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with real-time validation
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    // Clear error if field becomes valid
    if (error && validateEmail(newEmail) === null) {
      setError("");
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    // Clear error if field becomes valid
    if (error && validatePassword(newPassword) === null) {
      setError("");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card elevation-2">
        {/* Logo and Header Section */}
        <div className="login-header">
          <img 
            src={require('../assets/logo.png')} 
            alt="BookIt Logo" 
            style={{ width: '64px', height: '64px' }} 
          />
          {/* <span className="material-icons" style={{ fontSize: '48px', color: 'var(--primary)' }}>
            auto_stories
          </span> */}
          <h1>BookIt</h1>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="error">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} dir="rtl">
          {/* Email Input Group */}
          <div className="input-group">
            <span className="material-icons input-icon">email</span>
            <input
              type="text"
              className="input-field"
              placeholder="אימייל"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Password Input Group */}
          <div className="input-group">
            <span className="material-icons input-icon">lock</span>
            <input
              type="password"
              className="input-field"
              placeholder="סיסמה"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Submit Button with Loading State */}
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
                <span className="material-icons">login</span>
                התחבר
              </>
            )}
          </button>
        </form>

        {/* Registration Link */}
        <p className="register-link">
          עדיין אין לך משתמש? <Link to="/register">הירשם</Link>
        </p>
      </div>
      <style>
        {`
        .login-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
    padding: 1rem;
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    background: #ffffff;
    text-align: center;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .login-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .login-header h1 {
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

  .register-link {
    margin-top: 2rem;
    color: #627d98;
  }

  .register-link a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
    transition: color var(--transition-fast);
  }

  .register-link a:hover {
    color: var(--primary-dark);
  }

  @media (max-width: 480px) {
    .login-card {
      padding: var(--spacing-lg);
    }
  }

  @keyframes spin {
    100% { transform: rotate(360deg); }
  }

  .spinning {
    animation: spin 1s linear infinite;
  }
        `}
      </style>
    </div>
  );
}

export default Login;
