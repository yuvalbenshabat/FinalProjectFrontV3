// src/pages/Login.js
// Login Component
// This component handles user authentication
// It provides a form for users to log in with their email and password

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;
console.log("🔍 API_BASE:", API_BASE);

function Login() {
  // State for form inputs and loading
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Get login function from user context and navigation
  const { login } = useUser();
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form inputs
    if (!email || !password) {
      setError("נא למלא את כל השדות");
      return;
    }

    try {
      setIsLoading(true);
      
      // Send login request to server
      const response = await axios.post(`${API_BASE}/login`, {
        email,
        password
      });

      // Update user context and redirect on success
      login(response.data.user);
      navigate("/home");
    } catch (err) {
      console.error("❌ שגיאה בהתחברות:", err);
      setError(err.response?.data?.message || "שגיאה בשרת");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card elevation-2">
        {/* App logo */}
        <div className="login-header">
          <img src={require('../assets/logo.png')} alt="BookIt Logo" style={{ width: '64px', height: '64px' }} />
          {/* <span className="material-icons" style={{ fontSize: '48px', color: 'var(--primary)' }}>
            auto_stories
          </span> */}
          <h1>BookIt</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="error">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} dir="rtl">
          {/* Email input */}
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

          {/* Password input */}
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
                <span className="material-icons">login</span>
                התחבר
              </>
            )}
          </button>
        </form>

        {/* Registration link */}
        <p className="register-link">
          עדיין אין לך משתמש? <Link to="/register">הירשם</Link>
        </p>
      </div>

      <style>{`
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
      `}</style>
    </div>
  );
}

export default Login;
